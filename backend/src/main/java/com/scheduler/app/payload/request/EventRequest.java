package com.scheduler.app.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class EventRequest {
    @NotBlank
    private String title;

    private String description;

    private UUID activityId;

    @NotNull
    private LocalDate date;

    private LocalTime startTime;

    private Integer durationMinutes;
    
    private Boolean isCompleted;
}
