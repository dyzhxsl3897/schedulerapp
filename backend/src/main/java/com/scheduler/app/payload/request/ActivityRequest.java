package com.scheduler.app.payload.request;

import com.scheduler.app.model.Priority;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ActivityRequest {
    @NotBlank
    private String title;

    private String description;

    private Priority priority;
}
