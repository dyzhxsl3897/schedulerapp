import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography, Paper, Checkbox, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ScheduledEvent } from '../../types';
import { getPriorityColors } from '../../utils/priority';
import { format } from 'date-fns';

interface DayColumnProps {
  date: Date;
  events: ScheduledEvent[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onSelectEvent: (event: ScheduledEvent) => void;
  onDeleteEvent: (id: string) => void;
  spareHeight: number;
  selectedActivityId?: string;
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

const DayColumn: React.FC<DayColumnProps> = ({ date, events, onToggleComplete, onSelectEvent, onDeleteEvent, spareHeight, selectedActivityId }) => {
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
        borderRight: '1px solid #ddd', 
        minWidth: 120, 
        backgroundColor: isOver ? '#f0f7ff' : 'white',
        position: 'relative'
      }}
    >
      <Box sx={{ p: 1, textAlign: 'center', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle2">{format(date, 'EEE')}</Typography>
        <Typography variant="caption">{format(date, 'MMM d')}</Typography>
      </Box>

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
            >
            <Paper
              elevation={2}
              onClick={() => onSelectEvent(event)}
              sx={{
                position: 'absolute',
                top: top,
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                height: height,
                zIndex: 10,
                p: 0.5,
                boxSizing: 'border-box',
                px: '2px',
                overflow: 'hidden',
                backgroundColor: getPriorityColors(event.priority).backgroundColor,
                borderLeft: `4px solid ${getPriorityColors(event.priority).borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                ...(selectedActivityId && event.activityId === selectedActivityId && {
                  outline: '2px solid #1976d2',
                  outlineOffset: '-2px',
                  boxShadow: '0 0 8px rgba(25, 118, 210, 0.4)',
                }),
              }}
            >
              <Box display="flex" alignItems="center">
                <Checkbox
                  size="small"
                  checked={event.isCompleted}
                  onChange={(e) => onToggleComplete(event.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ p: 0 }}
                />
                <Typography variant="caption" fontWeight="bold" noWrap sx={{ ml: 0.5, textDecoration: event.isCompleted ? 'line-through' : 'none' }}>
                  {event.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                  sx={{ ml: 'auto', p: 0 }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                {event.startTime?.substring(0, 5)} ({event.durationMinutes}m)
              </Typography>
            </Paper>
            </Tooltip>
          );
        })}
      </Box>

      {/* Spare Section */}
      <Box sx={{ minHeight: spareHeight, borderTop: '2px dashed #ccc', p: 0.5 }}>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#888' }}>Spare Section</Typography>
        {spareEvents.map(event => (
          <Tooltip
            key={event.id}
            title={<>{event.title}<br />{event.startTime ? event.startTime.substring(0, 5) : 'No time'}<br />{event.durationMinutes} min</>}
            arrow
            placement="top"
          >
          <Paper
            elevation={1}
            onClick={() => onSelectEvent(event)}
            sx={{
                p: 0.5,
                mb: 0.5,
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: getPriorityColors(event.priority).backgroundColor,
                borderLeft: `4px solid ${getPriorityColors(event.priority).borderColor}`,
                ...(selectedActivityId && event.activityId === selectedActivityId && {
                  outline: '2px solid #1976d2',
                  outlineOffset: '-2px',
                  boxShadow: '0 0 8px rgba(25, 118, 210, 0.4)',
                }),
            }}
          >
            <Box display="flex" alignItems="center">
              <Checkbox
                size="small"
                checked={event.isCompleted}
                onChange={(e) => onToggleComplete(event.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                sx={{ p: 0 }}
              />
              <Typography variant="caption" fontWeight="bold" noWrap sx={{ ml: 0.5, textDecoration: event.isCompleted ? 'line-through' : 'none' }}>
                {event.title}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                sx={{ ml: 'auto', p: 0 }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            {event.startTime && (
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
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
