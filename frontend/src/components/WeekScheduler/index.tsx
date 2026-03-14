import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import DayColumn from './DayColumn';
import { ScheduledEvent } from '../../types';
import { startOfWeek, addDays } from 'date-fns';

interface WeekSchedulerProps {
  currentDate: Date;
  events: ScheduledEvent[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onSelectEvent: (event: ScheduledEvent) => void;
}

const START_HOUR = 15;
const END_HOUR = 24;
const HOUR_HEIGHT = 60;

const WeekScheduler: React.FC<WeekSchedulerProps> = ({ currentDate, events, onToggleComplete, onSelectEvent }) => {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const maxSpareHeight = useMemo(() => {
    const countsByDay: Record<string, number> = {};
    for (const event of events) {
      if (!event.startTime) {
        countsByDay[event.date] = (countsByDay[event.date] || 0) + 1;
      }
    }
    const maxCount = Math.max(0, ...Object.values(countsByDay));
    return Math.max(60, 20 + maxCount * 30);
  }, [events]);

  return (
    <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: 1 }}>
      {/* Time Labels Column */}
      <Box sx={{ width: 60, borderRight: '1px solid #ddd', backgroundColor: '#f9f9f9', flexShrink: 0 }}>
        {/* Header placeholder to match DayColumn header */}
        <Box sx={{ p: 1, textAlign: 'center', borderBottom: '1px solid #ddd' }}>
          <Typography variant="subtitle2">&nbsp;</Typography>
          <Typography variant="caption">&nbsp;</Typography>
        </Box>
        {/* Time labels */}
        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
          <Box key={i} sx={{ height: HOUR_HEIGHT, textAlign: 'center', p: 1 }}>
            <Typography variant="caption" color="textSecondary">
              {START_HOUR + i}:00
            </Typography>
          </Box>
        ))}
        {/* Spare section spacer */}
        <Box sx={{ minHeight: maxSpareHeight, borderTop: '2px dashed #ccc' }} />
      </Box>

      {/* Week Columns */}
      <Box sx={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
        {days.map(day => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            events={events.filter(e => e.date === day.toISOString().split('T')[0])}
            onToggleComplete={onToggleComplete}
            onSelectEvent={onSelectEvent}
            spareHeight={maxSpareHeight}
          />
        ))}
      </Box>
    </Box>
  );
};

export default WeekScheduler;
