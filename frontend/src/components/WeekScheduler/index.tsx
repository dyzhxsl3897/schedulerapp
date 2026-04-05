import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import DayColumn from './DayColumn';
import { ScheduledEvent } from '../../types';
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { useIsMobile } from '../../hooks/useIsMobile';

interface WeekSchedulerProps {
  currentDate: Date;
  events: ScheduledEvent[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onSelectEvent: (event: ScheduledEvent) => void;
  onDeleteEvent: (id: string) => void;
  selectedActivityId?: string;
}

const START_HOUR = 15;
const END_HOUR = 21;
const HOUR_HEIGHT = 60;

const WeekScheduler: React.FC<WeekSchedulerProps> = ({ currentDate, events, onToggleComplete, onSelectEvent, onDeleteEvent, selectedActivityId }) => {
  const isMobile = useIsMobile();
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Mobile: selected day tab
  const todayIndex = days.findIndex(d => isToday(d));
  const [selectedDay, setSelectedDay] = useState(todayIndex >= 0 ? todayIndex : 0);

  // Reset to today's tab when week changes
  useEffect(() => {
    const idx = days.findIndex(d => isToday(d));
    setSelectedDay(idx >= 0 ? idx : 0);
  }, [startDate.toISOString()]);

  // Swipe gesture handling for mobile
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      setSelectedDay(prev => diff > 0 ? Math.max(0, prev - 1) : Math.min(6, prev + 1));
    }
    touchStartX.current = null;
  }, []);

  const maxSpareHeight = useMemo(() => {
    const countsByDay: Record<string, number> = {};
    for (const event of events) {
      if (!event.startTime) {
        countsByDay[event.date] = (countsByDay[event.date] || 0) + 1;
      } else {
        const hour = parseInt(event.startTime.split(':')[0], 10);
        if (hour < START_HOUR || hour >= END_HOUR) {
          countsByDay[event.date] = (countsByDay[event.date] || 0) + 1;
        }
      }
    }
    const maxCount = Math.max(0, ...Object.values(countsByDay));
    return Math.max(60, 28 + maxCount * 32);
  }, [events]);

  const timeLabelsColumn = (narrow?: boolean) => (
    <Box sx={{ width: narrow ? 40 : 60, borderRight: '1px solid #ddd', backgroundColor: '#f9f9f9', flexShrink: 0 }}>
      {/* Header placeholder to match DayColumn header */}
      <Box sx={{ p: narrow ? 0.5 : 1, textAlign: 'center', borderBottom: '1px solid #ddd' }}>
        <Typography variant="subtitle2" sx={{ fontSize: narrow ? '0.7rem' : undefined }}>&nbsp;</Typography>
        <Typography variant="caption">&nbsp;</Typography>
      </Box>
      {/* Time labels */}
      {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
        <Box key={i} sx={{ height: HOUR_HEIGHT, textAlign: 'center', p: narrow ? 0.5 : 1 }}>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: narrow ? '0.65rem' : undefined }}>
            {START_HOUR + i}:00
          </Typography>
        </Box>
      ))}
      {/* Spare section spacer */}
      <Box sx={{ minHeight: maxSpareHeight, borderTop: '2px dashed #ccc' }} />
    </Box>
  );

  // Mobile: single-day view with tabs
  if (isMobile) {
    const selectedDayDate = days[selectedDay];
    const dayEvents = events.filter(e => e.date === selectedDayDate.toISOString().split('T')[0]);

    return (
      <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
        {/* Day tabs */}
        <Tabs
          value={selectedDay}
          onChange={(_, v) => setSelectedDay(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              minWidth: 0,
              flex: 1,
              px: 1,
              py: 0.5,
            },
          }}
        >
          {days.map((day, i) => (
            <Tab
              key={i}
              label={
                <Box sx={{ textAlign: 'center', lineHeight: 1.2 }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: isToday(day) ? 'bold' : 'normal', fontSize: '0.7rem' }}>
                    {format(day, 'EEE')}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday(day) ? 'bold' : 'normal',
                      ...(isToday(day) && {
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        lineHeight: '24px',
                        mx: 'auto',
                        fontSize: '0.75rem',
                      }),
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Single day view with swipe */}
        <Box
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          sx={{ display: 'flex', transition: 'opacity 0.15s ease' }}
        >
          {timeLabelsColumn(true)}
          <Box sx={{ flex: 1 }}>
            <DayColumn
              key={selectedDayDate.toISOString()}
              date={selectedDayDate}
              events={dayEvents}
              onToggleComplete={onToggleComplete}
              onSelectEvent={onSelectEvent}
              onDeleteEvent={onDeleteEvent}
              spareHeight={maxSpareHeight}
              selectedActivityId={selectedActivityId}
              isMobile
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // Desktop: original 7-column layout
  return (
    <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: 1 }}>
      {timeLabelsColumn()}

      {/* Week Columns */}
      <Box sx={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
        {days.map(day => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            events={events.filter(e => e.date === day.toISOString().split('T')[0])}
            onToggleComplete={onToggleComplete}
            onSelectEvent={onSelectEvent}
            onDeleteEvent={onDeleteEvent}
            spareHeight={maxSpareHeight}
            selectedActivityId={selectedActivityId}
          />
        ))}
      </Box>
    </Box>
  );
};

export default WeekScheduler;
