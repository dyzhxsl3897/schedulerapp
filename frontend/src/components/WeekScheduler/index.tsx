import React from 'react';
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

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_HEIGHT = 60;

const WeekScheduler: React.FC<WeekSchedulerProps> = ({ currentDate, events, onToggleComplete, onSelectEvent }) => {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <Box sx={{ display: 'flex', height: '80vh', overflow: 'hidden', border: '1px solid #ddd', borderRadius: 1 }}>
      {/* Time Labels Column */}
      <Box sx={{ width: 60, borderRight: '1px solid #ddd', backgroundColor: '#f9f9f9', pt: '100px' }}>
        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
          <Box key={i} sx={{ height: HOUR_HEIGHT, textAlign: 'center', p: 1 }}>
            <Typography variant="caption" color="textSecondary">
              {START_HOUR + i}:00
            </Typography>
          </Box>
        ))}
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
          />
        ))}
      </Box>
    </Box>
  );
};

export default WeekScheduler;
