import React from 'react';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import GrainIcon from '@mui/icons-material/Grain';
import OpacityIcon from '@mui/icons-material/Opacity';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';

export function getWeatherLabel(code: number): string {
  if (code <= 1) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

export function getWeatherIcon(code: number, fontSize: number = 20): React.ReactElement {
  const s = { color: '', fontSize };
  if (code <= 1) { s.color = '#f9a825'; return <WbSunnyIcon sx={s} />; }
  if (code <= 3) { s.color = '#90a4ae'; return <CloudIcon sx={s} />; }
  if (code === 45 || code === 48) { s.color = '#b0bec5'; return <CloudIcon sx={s} />; }
  if (code >= 51 && code <= 57) { s.color = '#4fc3f7'; return <GrainIcon sx={s} />; }
  if (code >= 61 && code <= 67) { s.color = '#1e88e5'; return <OpacityIcon sx={s} />; }
  if (code >= 71 && code <= 77) { s.color = '#4dd0e1'; return <AcUnitIcon sx={s} />; }
  if (code >= 80 && code <= 82) { s.color = '#1565c0'; return <OpacityIcon sx={s} />; }
  if (code >= 85 && code <= 86) { s.color = '#80deea'; return <AcUnitIcon sx={s} />; }
  if (code >= 95 && code <= 99) { s.color = '#7e57c2'; return <ThunderstormIcon sx={s} />; }
  s.color = '#bdbdbd'; return <CloudIcon sx={s} />;
}
