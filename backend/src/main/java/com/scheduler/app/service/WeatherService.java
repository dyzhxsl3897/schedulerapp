package com.scheduler.app.service;

import com.scheduler.app.model.WeatherCache;
import com.scheduler.app.payload.response.WeatherResponse;
import com.scheduler.app.repository.WeatherCacheRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WeatherService {

    private static final Logger logger = LoggerFactory.getLogger(WeatherService.class);
    private static final String OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
    private static final long CACHE_HOURS = 6;

    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private WeatherCacheRepository weatherCacheRepository;

    public List<WeatherResponse> getWeather(double lat, double lon, LocalDate start, LocalDate end) {
        double roundedLat = Math.round(lat * 100.0) / 100.0;
        double roundedLon = Math.round(lon * 100.0) / 100.0;

        // Check cache
        List<WeatherCache> cached = weatherCacheRepository.findByLatitudeAndLongitudeAndDateBetween(
                roundedLat, roundedLon, start, end);

        LocalDateTime cacheThreshold = LocalDateTime.now().minusHours(CACHE_HOURS);
        boolean cacheValid = !cached.isEmpty()
                && cached.stream().allMatch(c -> c.getFetchedAt().isAfter(cacheThreshold))
                && cached.size() >= (int) (end.toEpochDay() - start.toEpochDay() + 1);

        if (cacheValid) {
            return cached.stream()
                    .map(c -> new WeatherResponse(c.getDate().toString(), c.getTempMax(), c.getTempMin(), c.getWeatherCode()))
                    .sorted(Comparator.comparing(WeatherResponse::getDate))
                    .collect(Collectors.toList());
        }

        // Fetch from Open-Meteo
        try {
            String url = String.format("%s?latitude=%.2f&longitude=%.2f&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&start_date=%s&end_date=%s",
                    OPEN_METEO_URL, roundedLat, roundedLon, start, end);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null || !response.containsKey("daily")) {
                logger.warn("Empty response from Open-Meteo");
                return Collections.emptyList();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> daily = (Map<String, Object>) response.get("daily");
            List<String> dates = (List<String>) daily.get("time");
            List<Number> maxTemps = (List<Number>) daily.get("temperature_2m_max");
            List<Number> minTemps = (List<Number>) daily.get("temperature_2m_min");
            List<Number> weatherCodes = (List<Number>) daily.get("weather_code");

            if (dates == null || maxTemps == null || minTemps == null || weatherCodes == null) {
                logger.warn("Incomplete daily data from Open-Meteo");
                return Collections.emptyList();
            }

            // Delete old cache for this location/range and save new data
            if (!cached.isEmpty()) {
                weatherCacheRepository.deleteAll(cached);
            }

            List<WeatherResponse> results = new ArrayList<>();
            for (int i = 0; i < dates.size(); i++) {
                LocalDate date = LocalDate.parse(dates.get(i));
                double tempMax = maxTemps.get(i).doubleValue();
                double tempMin = minTemps.get(i).doubleValue();
                int code = weatherCodes.get(i).intValue();

                WeatherCache entry = new WeatherCache(roundedLat, roundedLon, date, tempMax, tempMin, code);
                weatherCacheRepository.save(entry);

                results.add(new WeatherResponse(dates.get(i), tempMax, tempMin, code));
            }

            return results;
        } catch (Exception e) {
            logger.error("Failed to fetch weather from Open-Meteo: {}", e.getMessage(), e);
            // Return stale cache if available
            if (!cached.isEmpty()) {
                return cached.stream()
                        .map(c -> new WeatherResponse(c.getDate().toString(), c.getTempMax(), c.getTempMin(), c.getWeatherCode()))
                        .sorted(Comparator.comparing(WeatherResponse::getDate))
                        .collect(Collectors.toList());
            }
            return Collections.emptyList();
        }
    }
}
