package com.scheduler.app.controller;

import com.scheduler.app.model.Activity;
import com.scheduler.app.model.Event;
import com.scheduler.app.payload.request.EventRequest;
import com.scheduler.app.payload.response.EventResponse;
import com.scheduler.app.payload.response.MessageResponse;
import com.scheduler.app.repository.ActivityRepository;
import com.scheduler.app.repository.EventRepository;
import com.scheduler.app.security.services.UserDetailsImpl;
import com.scheduler.app.service.ParentChildService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/events")
public class EventController {
    @Autowired
    EventRepository eventRepository;

    @Autowired
    ActivityRepository activityRepository;

    @Autowired
    ParentChildService parentChildService;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<EventResponse>> getEvents(
            @RequestParam(name = "start", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(name = "end", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) UUID forUserId) {

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        List<Event> events;
        if (start != null && end != null) {
            events = eventRepository.findByUserIdAndDateBetween(targetUserId, start, end);
        } else {
            events = eventRepository.findByUserId(targetUserId);
        }

        return ResponseEntity.ok(toEventResponses(events));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<EventResponse> createEvent(
            @RequestParam(required = false) UUID forUserId,
            @Valid @RequestBody EventRequest eventRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        Event event = new Event(
                eventRequest.getTitle(),
                eventRequest.getDescription(),
                eventRequest.getDate(),
                eventRequest.getStartTime(),
                eventRequest.getDurationMinutes(),
                targetUserId,
                eventRequest.getActivityId()
        );

        Event savedEvent = eventRepository.save(event);
        return new ResponseEntity<>(toEventResponse(savedEvent), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateEvent(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) UUID forUserId,
            @Valid @RequestBody EventRequest eventRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        return eventRepository.findById(id).map(event -> {
            if (!event.getUserId().equals(targetUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to update this event."));
            }

            event.setTitle(eventRequest.getTitle());
            event.setDescription(eventRequest.getDescription());
            event.setDate(eventRequest.getDate());
            event.setStartTime(eventRequest.getStartTime());
            event.setDurationMinutes(eventRequest.getDurationMinutes());
            if (eventRequest.getIsCompleted() != null) {
                event.setCompleted(eventRequest.getIsCompleted());
            }

            eventRepository.save(event);
            return ResponseEntity.ok(toEventResponse(event));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteEventsByDateRange(
            @RequestParam(name = "start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(name = "end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) UUID forUserId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());
        eventRepository.deleteByUserIdAndDateBetween(targetUserId, start, end);
        return ResponseEntity.ok(new MessageResponse("Events deleted successfully!"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteEvent(
            @PathVariable("id") UUID id,
            @RequestParam(required = false) UUID forUserId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID targetUserId = parentChildService.resolveTargetUserId(forUserId, userDetails.getId());

        return eventRepository.findById(id).map(event -> {
            if (!event.getUserId().equals(targetUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You are not authorized to delete this event."));
            }

            eventRepository.delete(event);
            return ResponseEntity.ok(new MessageResponse("Event deleted successfully!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    private List<EventResponse> toEventResponses(List<Event> events) {
        Set<UUID> activityIds = events.stream()
                .map(Event::getActivityId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, Activity> activityMap = activityIds.isEmpty()
                ? Collections.emptyMap()
                : activityRepository.findAllById(activityIds).stream()
                    .collect(Collectors.toMap(Activity::getId, Function.identity()));

        return events.stream()
                .map(event -> EventResponse.fromEventAndActivity(event, activityMap.get(event.getActivityId())))
                .collect(Collectors.toList());
    }

    private EventResponse toEventResponse(Event event) {
        Activity activity = null;
        if (event.getActivityId() != null) {
            activity = activityRepository.findById(event.getActivityId()).orElse(null);
        }
        return EventResponse.fromEventAndActivity(event, activity);
    }
}