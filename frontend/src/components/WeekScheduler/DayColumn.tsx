import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography, Paper, Checkbox, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ScheduledEvent, DayWeather } from '../../types';
import { getPriorityColors } from '../../utils/priority';
import { getWeatherIcon, getWeatherLabel } from '../../utils/weatherIcons';
import { format } from 'date-fns';

interface DayColumnProps {
  date: Date;
  events: ScheduledEvent[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onSelectEvent: (event: ScheduledEvent) => void;
  onDeleteEvent: (id: string) => void;
  spareHeight: number;
  selectedActivityId?: string;
  isMobile?: boolean;
  weather?: DayWeather;
}

const START_HOUR = 15;
const END_HOUR = 21;
const HOUR_HEIGHT = 60; // pixels

function computeOverlapLayout(events: ScheduledEvent[]): Map<string, { column: number; totalColumns: number }> {
  if (events.length === 0) return new Map();

  const sorted = [...events].sort((a, b) => {
    const cmp = a.startTime!.localeCompare(b.startTime!);
    if (cmp !== 0) return cmp;
    return (b.durationMinutes || 60) - (a.durationMinutes || 60);
  });

  const getEnd = (e: ScheduledEvent) => {
    const [h, m] = e.startTime!.split(':').map(Number);
    return h * 60 + m + (e.durationMinutes || 60);
  };
  const getStart = (e: ScheduledEvent) => {
    const [h, m] = e.startTime!.split(':').map(Number);
    return h * 60 + m;
  };

  const assignments = new Map<string, { column: number; totalColumns: number }>();
  const columns: number[] = []; // each entry = end time of last event in that column

  for (const event of sorted) {
    const start = getStart(event);
    let placed = -1;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c] <= start) {
        placed = c;
        break;
      }
    }
    if (placed === -1) {
      placed = columns.length;
      columns.push(0);
    }
    columns[placed] = getEnd(event);
    assignments.set(event.id, { column: placed, totalColumns: 1 });
  }

  // Compute totalColumns per overlap cluster using connected components
  for (let i = 0; i < sorted.length; i++) {
    const group: number[] = [i];
    let clusterEnd = getEnd(sorted[i]);
    for (let j = i + 1; j < sorted.length; j++) {
      if (getStart(sorted[j]) < clusterEnd) {
        group.push(j);
        clusterEnd = Math.max(clusterEnd, getEnd(sorted[j]));
      }
    }
    if (group.length > 1) {
      const maxCol = Math.max(...group.map(idx => assignments.get(sorted[idx].id)!.column));
      const total = maxCol + 1;
      for (const idx of group) {
        assignments.get(sorted[idx].id)!.totalColumns = Math.max(
          assignments.get(sorted[idx].id)!.totalColumns,
          total
        );
      }
    }
  }

  return assignments;
}

const DayColumn: React.FC<DayColumnProps> = ({ date, events, onToggleComplete, onSelectEvent, onDeleteEvent, spareHeight, selectedActivityId, isMobile, weather }) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateStr}`,
    data: { date: dateStr },
  });

  const timedEvents = events.filter(e => {
    if (!e.startTime) return false;
    const hour = parseInt(e.startTime.split(':')[0], 10);
    return hour >= START_HOUR && hour < END_HOUR;
  });
  const overlapLayout = computeOverlapLayout(timedEvents);
  const spareEvents = events.filter(e => {
    if (!e.startTime) return true;
    const hour = parseInt(e.startTime.split(':')[0], 10);
    return hour < START_HOUR || hour >= END_HOUR;
  }).sort((a, b) => {
    // Events with startTime come first, sorted by startTime ascending
    if (a.startTime && !b.startTime) return -1;
    if (!a.startTime && b.startTime) return 1;
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    // Both without startTime: sort by createdAt ascending
    if (a.createdAt && b.createdAt) return a.createdAt.localeCompare(b.createdAt);
    return 0;
  });

  const calculateTop = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const relativeHours = hours - START_HOUR;
    return relativeHours * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  const calculateHeight = (duration: number) => {
    return (duration / 60) * HOUR_HEIGHT;
  };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        borderRight: isMobile ? 'none' : '1px solid #ddd',
        minWidth: isMobile ? 'auto' : 120,
        backgroundColor: isOver ? '#f0f7ff' : 'white',
        transition: 'background-color 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Header - hidden on mobile since tabs handle this */}
      {!isMobile && (
        <Box sx={{ p: 1, textAlign: 'center', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
          <Typography variant="subtitle2">{format(date, 'EEE')}</Typography>
          <Typography variant="caption">{format(date, 'MMM d')}</Typography>
          {weather && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.25 }}>
              <Tooltip title={getWeatherLabel(weather.weatherCode)}>
                {getWeatherIcon(weather.weatherCode, 16)}
              </Tooltip>
              <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                {Math.round(weather.tempMax)}° / {Math.round(weather.tempMin)}°
              </Typography>
            </Box>
          )}
        </Box>
      )}
      {/* Mobile: thin header with just the date for context */}
      {isMobile && (
        <Box sx={{ py: 0.5, px: 1, textAlign: 'center', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
          <Typography variant="body2" fontWeight="bold">
            {format(date, 'EEEE, MMM d')}
          </Typography>
          {weather && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <Tooltip title={getWeatherLabel(weather.weatherCode)}>
                {getWeatherIcon(weather.weatherCode, 18)}
              </Tooltip>
              <Typography variant="body2">
                {Math.round(weather.tempMax)}° / {Math.round(weather.tempMin)}°
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Time Grid Area */}
      <Box sx={{ position: 'relative', height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
        {/* Hour markers */}
        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
          <Box
            key={i}
            sx={{
              height: HOUR_HEIGHT,
              borderBottom: '1px solid #eee',
              boxSizing: 'border-box',
              pointerEvents: 'none'
            }}
          />
        ))}

        {/* Timed Events */}
        {timedEvents.map(event => {
          const top = calculateTop(event.startTime!);
          const height = calculateHeight(event.durationMinutes || 60);
          const layout = overlapLayout.get(event.id) || { column: 0, totalColumns: 1 };
          const widthPercent = 100 / layout.totalColumns;
          const leftPercent = layout.column * widthPercent;
          return (
            <Tooltip
              key={event.id}
              title={<>{event.title}<br />{event.startTime?.substring(0, 5)}<br />{event.durationMinutes} min</>}
              arrow
              placement="top"
              enterTouchDelay={isMobile ? 500 : 200}
            >
            <Paper
              elevation={2}
              onClick={() => onSelectEvent(event)}
              sx={{
                position: 'absolute',
                top: top,
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                height: Math.max(height, isMobile ? 36 : height),
                zIndex: 10,
                p: isMobile ? 0.75 : 0.5,
                boxSizing: 'border-box',
                px: isMobile ? '6px' : '2px',
                overflow: 'hidden',
                backgroundColor: getPriorityColors(event.priority).backgroundColor,
                borderLeft: `4px solid ${getPriorityColors(event.priority).borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                cursor: 'pointer',
                ...(isMobile && {
                  '&:active': {
                    transform: 'scale(0.98)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  },
                }),
                ...(selectedActivityId && event.activityId === selectedActivityId && {
                  outline: '2px solid #1976d2',
                  outlineOffset: '-2px',
                  boxShadow: '0 0 8px rgba(25, 118, 210, 0.4)',
                }),
              }}
            >
              <Box display="flex" alignItems="center">
                <Checkbox
                  size={isMobile ? 'medium' : 'small'}
                  checked={event.isCompleted}
                  onChange={(e) => onToggleComplete(event.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ p: isMobile ? '4px' : 0 }}
                />
                <Typography
                  variant={isMobile ? 'body2' : 'caption'}
                  fontWeight="bold"
                  noWrap
                  sx={{ ml: 0.5, textDecoration: event.isCompleted ? 'line-through' : 'none' }}
                >
                  {event.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                  sx={{ ml: 'auto', p: isMobile ? '4px' : 0 }}
                >
                  <CloseIcon sx={{ fontSize: isMobile ? 18 : 14 }} />
                </IconButton>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.65rem' }}>
                {event.startTime?.substring(0, 5)} ({event.durationMinutes}m)
              </Typography>
            </Paper>
            </Tooltip>
          );
        })}
      </Box>

      {/* Spare Section */}
      <Box sx={{ minHeight: spareHeight, borderTop: '2px dashed #ccc', p: isMobile ? 1 : 0.5 }}>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#888' }}>Spare Section</Typography>
        {spareEvents.map(event => (
          <Tooltip
            key={event.id}
            title={<>{event.title}<br />{event.startTime ? event.startTime.substring(0, 5) : 'No time'}<br />{event.durationMinutes} min</>}
            arrow
            placement="top"
            enterTouchDelay={isMobile ? 500 : 200}
          >
          <Paper
            elevation={1}
            onClick={() => onSelectEvent(event)}
            sx={{
                p: isMobile ? 1 : 0.5,
                mb: 0.5,
                fontSize: isMobile ? '0.85rem' : '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: getPriorityColors(event.priority).backgroundColor,
                borderLeft: `4px solid ${getPriorityColors(event.priority).borderColor}`,
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                cursor: 'pointer',
                ...(isMobile && {
                  '&:active': {
                    transform: 'scale(0.98)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  },
                }),
                ...(selectedActivityId && event.activityId === selectedActivityId && {
                  outline: '2px solid #1976d2',
                  outlineOffset: '-2px',
                  boxShadow: '0 0 8px rgba(25, 118, 210, 0.4)',
                }),
            }}
          >
            <Box display="flex" alignItems="center">
              <Checkbox
                size={isMobile ? 'medium' : 'small'}
                checked={event.isCompleted}
                onChange={(e) => onToggleComplete(event.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                sx={{ p: isMobile ? '4px' : 0 }}
              />
              <Typography
                variant={isMobile ? 'body2' : 'caption'}
                fontWeight="bold"
                noWrap
                sx={{ ml: 0.5, textDecoration: event.isCompleted ? 'line-through' : 'none' }}
              >
                {event.title}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                sx={{ ml: 'auto', p: isMobile ? '4px' : 0 }}
              >
                <CloseIcon sx={{ fontSize: isMobile ? 18 : 14 }} />
              </IconButton>
            </Box>
            {event.startTime && (
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.65rem' }}>
                {event.startTime.substring(0, 5)} ({event.durationMinutes}m)
              </Typography>
            )}
          </Paper>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

export default DayColumn;
