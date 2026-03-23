package com.scheduler.app.payload.request;

import com.scheduler.app.model.StrategyStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class GoalEntryRequest {
    @NotNull
    private UUID objectiveId;

    @NotBlank
    private String goal;

    private String strategy;

    private String measure;

    private LocalDate endDate;

    @Min(1)
    @Max(5)
    private Integer importance;

    private String result;

    private StrategyStatus status;

    private Integer sortOrder;
}
