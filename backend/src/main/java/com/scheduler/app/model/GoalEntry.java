package com.scheduler.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "goal_entries")
@Data
@NoArgsConstructor
public class GoalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "objective_id", nullable = false)
    private UUID objectiveId;

    @Column(columnDefinition = "TEXT")
    private String goal;

    @Column(columnDefinition = "TEXT")
    private String strategy;

    @Column(columnDefinition = "TEXT")
    private String measure;

    @Column(name = "end_date")
    private LocalDate endDate;

    private Integer importance;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Enumerated(EnumType.STRING)
    private StrategyStatus status = StrategyStatus.NOT_STARTED;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @CreationTimestamp
    @Column(updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public GoalEntry(UUID objectiveId, String goal, String strategy, String measure,
                     LocalDate endDate, Integer importance, String result, StrategyStatus status,
                     Integer sortOrder, UUID userId) {
        this.objectiveId = objectiveId;
        this.goal = goal;
        this.strategy = strategy;
        this.measure = measure;
        this.endDate = endDate;
        this.importance = importance;
        this.result = result;
        this.status = status != null ? status : StrategyStatus.NOT_STARTED;
        this.sortOrder = sortOrder;
        this.userId = userId;
    }
}
