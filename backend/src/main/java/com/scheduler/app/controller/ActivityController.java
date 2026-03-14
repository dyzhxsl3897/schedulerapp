package com.scheduler.app.controller;

import com.scheduler.app.model.Activity;
import com.scheduler.app.model.Priority;
import com.scheduler.app.payload.request.ActivityRequest;
import com.scheduler.app.payload.response.MessageResponse;
import com.scheduler.app.repository.ActivityRepository;
import com.scheduler.app.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/activities")
public class ActivityController {
    @Autowired
    ActivityRepository activityRepository;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Activity>> getAllActivities() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Activity> activities = activityRepository.findByUserId(userDetails.getId());
        return ResponseEntity.ok(activities);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Activity> createActivity(@Valid @RequestBody ActivityRequest activityRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        Activity activity = new Activity(
                activityRequest.getTitle(),
                activityRequest.getDescription(),
                activityRequest.getPriority() != null ? activityRequest.getPriority() : Priority.MEDIUM,
                userDetails.getId()
        );

        Activity savedActivity = activityRepository.save(activity);
        return new ResponseEntity<>(savedActivity, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateActivity(@PathVariable("id") UUID id, @Valid @RequestBody ActivityRequest activityRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        return activityRepository.findById(id).map(activity -> {
            if (!activity.getUserId().equals(userDetails.getId())) {
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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteActivity(@PathVariable("id") UUID id) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        return activityRepository.findById(id).map(activity -> {
            if (!activity.getUserId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to delete this activity."));
            }

            activityRepository.delete(activity);
            return ResponseEntity.ok(new MessageResponse("Activity deleted successfully!"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
