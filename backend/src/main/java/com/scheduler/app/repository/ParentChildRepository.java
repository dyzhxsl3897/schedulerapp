package com.scheduler.app.repository;

import com.scheduler.app.model.ParentChild;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ParentChildRepository extends JpaRepository<ParentChild, UUID> {
    List<ParentChild> findByParentId(UUID parentId);
    boolean existsByParentIdAndChildId(UUID parentId, UUID childId);
    void deleteByParentIdAndChildId(UUID parentId, UUID childId);
}