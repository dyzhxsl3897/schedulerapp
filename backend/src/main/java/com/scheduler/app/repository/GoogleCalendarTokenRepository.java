package com.scheduler.app.repository;

import com.scheduler.app.model.GoogleCalendarToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GoogleCalendarTokenRepository extends JpaRepository<GoogleCalendarToken, UUID> {
    Optional<GoogleCalendarToken> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}
