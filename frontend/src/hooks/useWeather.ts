import { useState, useRef, useCallback, useEffect } from 'react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import api from '../api/axios';
import { DayWeather } from '../types';

interface UseWeatherReturn {
  weatherData: Record<string, DayWeather> | null;
  loading: boolean;
  error: string | null;
  syncWeather: () => void;
}

export function useWeather(currentDate: Date): UseWeatherReturn {
  const [weatherData, setWeatherData] = useState<Record<string, DayWeather> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedWeek = useRef<string | null>(null);

  const getWeekKey = useCallback((date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return format(start, 'yyyy-MM-dd');
  }, []);

  const getCoords = useCallback(async () => {
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

    return { lat, lon };
  }, []);

  const fetchFromBackend = useCallback(async (date: Date, cacheOnly: boolean) => {
    const { lat, lon } = await getCoords();
    const start = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const end = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const response = await api.get('/weather', {
      params: { lat, lon, start, end, cacheOnly },
    });

    const data: Record<string, DayWeather> = {};
    for (const day of response.data) {
      data[day.date] = {
        tempMax: day.tempMax,
        tempMin: day.tempMin,
        weatherCode: day.weatherCode,
      };
    }
    return data;
  }, [getCoords]);

  // Sync fresh weather from Open-Meteo (button click)
  const syncWeather = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchFromBackend(currentDate, false);
      lastFetchedWeek.current = getWeekKey(currentDate);
      setWeatherData(Object.keys(data).length > 0 ? data : null);
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
  }, [currentDate, fetchFromBackend, getWeekKey]);

  // On mount and week change: load DB-cached weather (no Open-Meteo call)
  const currentWeekKey = getWeekKey(currentDate);
  useEffect(() => {
    let cancelled = false;
    lastFetchedWeek.current = currentWeekKey;

    fetchFromBackend(currentDate, true)
      .then(data => {
        if (!cancelled) {
          setWeatherData(Object.keys(data).length > 0 ? data : null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeatherData(null);
        }
      });

    return () => { cancelled = true; };
  }, [currentWeekKey, currentDate, fetchFromBackend]);

  return { weatherData, loading, error, syncWeather };
}
