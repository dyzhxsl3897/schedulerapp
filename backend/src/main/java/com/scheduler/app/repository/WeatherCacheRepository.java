package com.scheduler.app.repository;

import com.scheduler.app.model.WeatherCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface WeatherCacheRepository extends JpaRepository<WeatherCache, UUID> {

    List<WeatherCache> findByLatitudeAndLongitudeAndDateBetween(
            double latitude, double longitude, LocalDate start, LocalDate end);

    @Transactional
    void deleteByFetchedAtBefore(LocalDateTime cutoff);
}
