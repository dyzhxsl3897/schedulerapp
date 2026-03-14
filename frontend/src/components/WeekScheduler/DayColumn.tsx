import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography, Paper, Checkbox } from '@mui/material';
import { ScheduledEvent } from '../../types';
import { format } from 'date-fns';

interface DayColumnProps {
  date: Date;
  events: ScheduledEvent[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onSelectEvent: (event: ScheduledEvent) => void;
}

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_HEIGHT = 60; // pixels

const DayColumn: React.FC<DayColumnProps> = ({ date, events, onToggleComplete, onSelectEvent }) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateStr}`,
    data: { date: dateStr },
  });

  const timedEvents = events.filter(e => e.startTime);
  const spareEvents = events.filter(e => !e.startTime);

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

      {/* Spare Section */}
      <Box sx={{ minHeight: 60, borderBottom: '2px dashed #ccc', p: 0.5, backgroundColor: '#fffbe6' }}>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#888' }}>Spare Section</Typography>
        {spareEvents.map(event => (
          <Paper 
            key={event.id}
            elevation={1}
            onClick={() => onSelectEvent(event)}
            sx={{ 
                p: 0.5, 
                mb: 0.5, 
                fontSize: '0.75rem', 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: event.isCompleted ? '#e8f5e9' : 'white',
                borderLeft: '4px solid #ff9800'
            }}
          >
            <Checkbox 
              size="small" 
              checked={event.isCompleted} 
              onChange={(e) => onToggleComplete(event.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              sx={{ p: 0 }}
            />
            <Typography variant="caption" noWrap sx={{ ml: 0.5 }}>{event.title}</Typography>
          </Paper>
        ))}
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
          return (
            <Paper
              key={event.id}
              elevation={2}
              onClick={() => onSelectEvent(event)}
              sx={{
                position: 'absolute',
                top: top,
                left: 2,
                right: 2,
                height: height,
                zIndex: 10,
                p: 0.5,
                overflow: 'hidden',
                backgroundColor: event.isCompleted ? '#e8f5e9' : '#e3f2fd',
                borderLeft: '4px solid #2196f3',
                display: 'flex',
                flexDirection: 'column'
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
                <Typography variant="caption" fontWeight="bold" noWrap sx={{ ml: 0.5 }}>
                  {event.title}
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                {event.startTime?.substring(0, 5)} ({event.durationMinutes}m)
              </Typography>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default DayColumn;
