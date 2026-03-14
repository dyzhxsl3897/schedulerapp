package com.scheduler.app.repository;

import com.scheduler.app.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByUserIdAndDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);
    List<Event> findByUserId(UUID userId);
    List<Event> findByActivityId(UUID activityId);
    void deleteByActivityId(UUID activityId);
}
