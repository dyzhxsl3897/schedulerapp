package com.scheduler.app.payload.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.scheduler.app.model.Activity;
import com.scheduler.app.model.Event;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class EventResponse {
    private UUID id;
    private UUID activityId;
    private String title;
    private String description;
    private LocalDate date;
    private LocalTime startTime;
    private Integer durationMinutes;
    @JsonProperty("isCompleted")
    private boolean isCompleted;
    private UUID userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EventResponse fromEventAndActivity(Event event, Activity activity) {
        EventResponse response = new EventResponse();
        response.setId(event.getId());
        response.setActivityId(event.getActivityId());
        response.setDate(event.getDate());
        response.setStartTime(event.getStartTime());
        response.setDurationMinutes(event.getDurationMinutes());
        response.setCompleted(event.isCompleted());
        response.setUserId(event.getUserId());
        response.setCreatedAt(event.getCreatedAt());
        response.setUpdatedAt(event.getUpdatedAt());

        if (activity != null) {
            response.setTitle(activity.getTitle());
            response.setDescription(activity.getDescription());
        } else {
            response.setTitle(event.getTitle());
            response.setDescription(event.getDescription());
        }

        return response;
    }
}
