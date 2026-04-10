package com.scheduler.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "weather_cache", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"latitude", "longitude", "date"})
})
@Data
@NoArgsConstructor
public class WeatherCache {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "temp_max", nullable = false)
    private double tempMax;

    @Column(name = "temp_min", nullable = false)
    private double tempMin;

    @Column(name = "weather_code", nullable = false)
    private int weatherCode;

    @CreationTimestamp
    @Column(name = "fetched_at", updatable = false)
    private LocalDateTime fetchedAt;

    public WeatherCache(double latitude, double longitude, LocalDate date, double tempMax, double tempMin, int weatherCode) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.date = date;
        this.tempMax = tempMax;
        this.tempMin = tempMin;
        this.weatherCode = weatherCode;
    }
}
