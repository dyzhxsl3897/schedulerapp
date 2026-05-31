package com.scheduler.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "parent_child_relationships")
@Data
@NoArgsConstructor
public class ParentChild {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID parentId;

    @Column(nullable = false)
    private UUID childId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ParentChild(UUID parentId, UUID childId) {
        this.parentId = parentId;
        this.childId = childId;
        this.createdAt = LocalDateTime.now();
    }
}