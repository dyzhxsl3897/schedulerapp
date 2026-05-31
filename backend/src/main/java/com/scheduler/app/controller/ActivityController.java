package com.scheduler.app.controller;

import com.scheduler.app.model.Activity;
import com.scheduler.app.model.Priority;
import com.scheduler.app.payload.request.ActivityRequest;
import com.scheduler.app.payload.response.MessageResponse;
import com.scheduler.app.repository.ActivityRepository;
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

import com.scheduler.app.payload.request.ReorderRequest;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/activities")
public class ActivityController {
    @Autowired
    ActivityRepository activityRepository;

    @Autowired
    ParentChildService parentChildService;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Activity>> getAllActivities(
            @RequestParam(required = false) UUID forUserId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());
        List<Activity> activities = activityRepository.findByUserIdOrderBySortOrderAsc(targetUserId);
        return ResponseEntity.ok(activities);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Activity> createActivity(
            @RequestParam(required = false) UUID forUserId,
            @Valid @RequestBody ActivityRequest activityRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        List<Activity> existing = activityRepository.findByUserIdOrderBySortOrderAsc(targetUserId);
        int nextSortOrder = existing.isEmpty() ? 0 : existing.stream()
                .mapToInt(a -> a.getSortOrder() != null ? a.getSortOrder() : 0)
                .max().orElse(0) + 1;

        Activity activity = new Activity(
                activityRequest.getTitle(),
                activityRequest.getDescription(),
                activityRequest.getPriority() != null ? activityRequest.getPriority() : Priority.MEDIUM,
                targetUserId,
                nextSortOrder
        );

        Activity savedActivity = activityRepository.save(activity);
        return new ResponseEntity<>(savedActivity, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateActivity(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) UUID forUserId,
            @Valid @RequestBody ActivityRequest activityRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        return activityRepository.findById(id).map(activity -> {
            if (!activity.getUserId().equals(targetUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to update this activity."));
            }

            activity.setTitle(activityRequest.getTitle());
            activity.setDescription(activityRequest.getDescription());
            if (activityRequest.getPriority() != null) {
                activity.setPriority(activityRequest.getPriority());
            }

            activityRepository.save(activity);
            return ResponseEntity.ok(activity);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> reorderActivities(
            @RequestParam(required = false) UUID forUserId,
            @RequestBody List<ReorderRequest> reorderRequests) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        for (ReorderRequest req : reorderRequests) {
            activityRepository.findById(req.getId()).ifPresent(activity -> {
                if (activity.getUserId().equals(targetUserId)) {
                    activity.setSortOrder(req.getSortOrder());
                    activityRepository.save(activity);
                }
            });
        }
        return ResponseEntity.ok(new MessageResponse("Activities reordered successfully!"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteActivity(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) UUID forUserId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        return activityRepository.findById(id).map(activity -> {
            if (!activity.getUserId().equals(targetUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to delete this activity."));
            }

            activityRepository.delete(activity);
            return ResponseEntity.ok(new MessageResponse("Activity deleted successfully!"));
        }).orElse(ResponseEntity.notFound().build());
    }
}