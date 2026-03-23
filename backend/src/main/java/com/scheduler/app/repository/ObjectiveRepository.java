package com.scheduler.app.repository;

import com.scheduler.app.model.Objective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ObjectiveRepository extends JpaRepository<Objective, UUID> {
    List<Objective> findByUserIdAndAcademicYearOrderBySortOrder(UUID userId, Integer academicYear);
    List<Objective> findByUserId(UUID userId);
}
