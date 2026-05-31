package com.scheduler.app.controller;

import com.scheduler.app.model.Objective;
import com.scheduler.app.payload.request.ObjectiveRequest;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/objectives")
public class ObjectiveController {
    @Autowired
    ObjectiveRepository objectiveRepository;

    @Autowired
    GoalEntryRepository goalEntryRepository;

    @Autowired
    ParentChildService parentChildService;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Objective>> getObjectives(
            @RequestParam(required = false) Integer academicYear,
            @RequestParam(required = false) UUID forUserId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        List<Objective> objectives;
        if (academicYear != null) {
            objectives = objectiveRepository.findByUserIdAndAcademicYearOrderBySortOrder(targetUserId, academicYear);
        } else {
            objectives = objectiveRepository.findByUserId(targetUserId);
        }
        return ResponseEntity.ok(objectives);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Objective> createObjective(
            @RequestParam(required = false) UUID forUserId,
            @Valid @RequestBody ObjectiveRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        Objective objective = new Objective(
                request.getTitle(),
                request.getDescription(),
                request.getAcademicYear(),
                request.getSortOrder() != null ? request.getSortOrder() : 0,
                targetUserId
        );

        Objective saved = objectiveRepository.save(objective);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateObjective(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) UUID forUserId,
            @Valid @RequestBody ObjectiveRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        return objectiveRepository.findById(id).map(objective -> {
            if (!objective.getUserId().equals(targetUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to update this objective."));
            }

            objective.setTitle(request.getTitle());
            objective.setDescription(request.getDescription());
            objective.setAcademicYear(request.getAcademicYear());
            if (request.getSortOrder() != null) {
                objective.setSortOrder(request.getSortOrder());
            }

            objectiveRepository.save(objective);
            return ResponseEntity.ok(objective);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteObjective(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) UUID forUserId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        return objectiveRepository.findById(id).map(objective -> {
            if (!objective.getUserId().equals(targetUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to delete this objective."));
            }

            goalEntryRepository.deleteByObjectiveId(id);
            objectiveRepository.delete(objective);
            return ResponseEntity.ok(new MessageResponse("Objective deleted successfully!"));
        }).orElse(ResponseEntity.notFound().build());
    }
}