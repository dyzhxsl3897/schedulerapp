package com.scheduler.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "activity_id")
    private UUID activityId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "is_completed")
    private boolean isCompleted = false;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    public Event(String title, LocalDate date, LocalTime startTime, Integer durationMinutes, UUID userId, UUID activityId) {
        this.title = title;
        this.date = date;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.userId = userId;
        this.activityId = activityId;
    }
}
