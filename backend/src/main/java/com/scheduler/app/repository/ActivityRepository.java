package com.scheduler.app.repository;

import com.scheduler.app.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findByUserId(UUID userId);
    List<Activity> findByUserIdOrderBySortOrderAsc(UUID userId);
}
