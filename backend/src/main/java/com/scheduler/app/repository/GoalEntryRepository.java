package com.scheduler.app.repository;

import com.scheduler.app.model.GoalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalEntryRepository extends JpaRepository<GoalEntry, UUID> {
    List<GoalEntry> findByObjectiveIdInOrderBySortOrder(List<UUID> objectiveIds);
    void deleteByObjectiveId(UUID objectiveId);
}
