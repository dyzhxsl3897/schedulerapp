package com.scheduler.app.controller;

import com.scheduler.app.model.GoalEntry;
import com.scheduler.app.model.Objective;
import com.scheduler.app.model.StrategyStatus;
import com.scheduler.app.payload.request.GoalEntryRequest;
import com.scheduler.app.payload.response.MessageResponse;
import com.scheduler.app.repository.GoalEntryRepository;
import com.scheduler.app.repository.ObjectiveRepository;
import com.scheduler.app.security.services.UserDetailsImpl;
import com.scheduler.app.service.ParentChildService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/goal-entries")
public class GoalEntryController {
    @Autowired
    GoalEntryRepository goalEntryRepository;

    @Autowired
    ObjectiveRepository objectiveRepository;

    @Autowired
    ParentChildService parentChildService;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getGoalEntries(
            @RequestParam String objectiveIds,
            @RequestParam(required = false) UUID forUserId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        List<UUID> ids = Arrays.stream(objectiveIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .toList();

        // Verify all objectives belong to the target user
        long ownedCount = objectiveRepository.findAllById(ids).stream()
                .filter(o -> o.getUserId().equals(targetUserId))
                .count();
        if (ownedCount != ids.size()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to access these objectives."));
        }

        List<GoalEntry> entries = goalEntryRepository.findByObjectiveIdInOrderBySortOrder(ids);
        return ResponseEntity.ok(entries);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> createGoalEntry(
            @RequestParam(required = false) UUID forUserId,
            @Valid @RequestBody GoalEntryRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        // Verify the parent objective belongs to the target user
        return objectiveRepository.findById(request.getObjectiveId()).map(objective -> {
            if (!objective.getUserId().equals(targetUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to add goals to this objective."));
            }

            GoalEntry entry = new GoalEntry(
                    request.getObjectiveId(),
                    request.getGoal(),
                    request.getStrategy(),
                    request.getMeasure(),
                    request.getEndDate(),
                    request.getImportance(),
                    request.getResult(),
                    request.getStatus() != null ? request.getStatus() : StrategyStatus.NOT_STARTED,
                    request.getSortOrder() != null ? request.getSortOrder() : 0,
                    targetUserId
            );

            GoalEntry saved = goalEntryRepository.save(entry);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateGoalEntry(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) UUID forUserId,
            @Valid @RequestBody GoalEntryRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        return goalEntryRepository.findById(id).map(entry -> {
            if (!entry.getUserId().equals(targetUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to update this goal entry."));
            }

            entry.setObjectiveId(request.getObjectiveId());
            entry.setGoal(request.getGoal());
            entry.setStrategy(request.getStrategy());
            entry.setMeasure(request.getMeasure());
            entry.setEndDate(request.getEndDate());
            entry.setImportance(request.getImportance());
            entry.setResult(request.getResult());
            if (request.getStatus() != null) {
                entry.setStatus(request.getStatus());
            }
            if (request.getSortOrder() != null) {
                entry.setSortOrder(request.getSortOrder());
            }

            goalEntryRepository.save(entry);
            return ResponseEntity.ok(entry);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteGoalEntry(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) UUID forUserId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        return goalEntryRepository.findById(id).map(entry -> {
            if (!entry.getUserId().equals(targetUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to delete this goal entry."));
            }

            goalEntryRepository.delete(entry);
            return ResponseEntity.ok(new MessageResponse("Goal entry deleted successfully!"));
        }).orElse(ResponseEntity.notFound().build());
    }
}