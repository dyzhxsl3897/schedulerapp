package com.scheduler.app.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ObjectiveRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Integer academicYear;

    private Integer sortOrder;
}
