package com.scheduler.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "objectives")
@Data
@NoArgsConstructor
public class Objective {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "academic_year", nullable = false)
    private Integer academicYear;

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

    public Objective(String title, String description, Integer academicYear, Integer sortOrder, UUID userId) {
        this.title = title;
        this.description = description;
        this.academicYear = academicYear;
        this.sortOrder = sortOrder;
        this.userId = userId;
    }
}
