import { useState, useRef, useCallback } from 'react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import api from '../api/axios';
import { DayWeather } from '../types';

interface UseWeatherReturn {
  weatherData: Record<string, DayWeather> | null;
  loading: boolean;
  enabled: boolean;
  error: string | null;
  toggleWeather: () => void;
}

export function useWeather(currentDate: Date): UseWeatherReturn {
  const [weatherData, setWeatherData] = useState<Record<string, DayWeather> | null>(null);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Map<string, Record<string, DayWeather>>>(new Map());
  const lastFetchedWeek = useRef<string | null>(null);

  const getWeekKey = useCallback((date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return format(start, 'yyyy-MM-dd');
  }, []);

  const fetchWeather = useCallback(async (date: Date) => {
    const weekKey = getWeekKey(date);

    // Return cached data if available
    if (cache.current.has(weekKey)) {
      setWeatherData(cache.current.get(weekKey)!);
      lastFetchedWeek.current = weekKey;
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get coordinates from localStorage or geolocation
      let lat = parseFloat(localStorage.getItem('weather_lat') || '');
      let lon = parseFloat(localStorage.getItem('weather_lon') || '');

      if (isNaN(lat) || isNaN(lon)) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        localStorage.setItem('weather_lat', String(lat));
        localStorage.setItem('weather_lon', String(lon));
      }

      const start = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const response = await api.get('/weather', {
        params: { lat, lon, start, end },
      });

      const data: Record<string, DayWeather> = {};
      for (const day of response.data) {
        data[day.date] = {
          tempMax: day.tempMax,
          tempMin: day.tempMin,
          weatherCode: day.weatherCode,
        };
      }

      cache.current.set(weekKey, data);
      lastFetchedWeek.current = weekKey;
      setWeatherData(data);
    } catch (err: unknown) {
      if (err instanceof GeolocationPositionError) {
        setError('Location access is needed for weather.');
      } else {
        setError('Failed to fetch weather data.');
      }
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getWeekKey]);

  const toggleWeather = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      if (next) {
        fetchWeather(currentDate);
      }
      return next;
    });
  }, [currentDate, fetchWeather]);

  // If enabled and week changed, fetch new data
  const currentWeekKey = getWeekKey(currentDate);
  if (enabled && lastFetchedWeek.current !== currentWeekKey && !loading) {
    fetchWeather(currentDate);
  }

  return { weatherData, loading, enabled, error, toggleWeather };
}
