import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { format, parse } from 'date-fns';
import { Activity, ScheduledEvent } from '../types';

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title?: string, description?: string, date?: string, startTime?: string, durationMinutes?: number }) => void;
  activity: Activity | null;
  date: string | null;
  event?: ScheduledEvent | null;
}

const EventDialog: React.FC<EventDialogProps> = ({ open, onClose, onSave, activity, date, event }) => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState('60');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);

  const isEditing = !!event;
  const isStandalone = !activity && !event;

  useEffect(() => {
    if (open) {
      if (event) {
        setStartTime(event.startTime ? parse(event.startTime.substring(0, 5), 'HH:mm', new Date()) : null);
        setDuration(event.durationMinutes?.toString() || '60');
      } else {
        setStartTime(null);
        setDuration('60');
      }
      setTitle('');
      setDescription('');
      setEventDate(null);
    }
  }, [open, event]);

  const handleSave = () => {
    const startTimeStr = startTime ? format(startTime, 'HH:mm') : undefined;
    if (isStandalone) {
      onSave({
        title: title,
        description: description || undefined,
        date: eventDate ? format(eventDate, 'yyyy-MM-dd') : undefined,
        startTime: startTimeStr,
        durationMinutes: startTimeStr ? parseInt(duration) : undefined,
      });
    } else {
      onSave({
        startTime: startTimeStr,
        durationMinutes: startTimeStr ? parseInt(duration) : undefined,
      });
    }
    onClose();
  };

  const canSave = isStandalone ? (title.trim() && eventDate) : true;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{isEditing ? 'Edit Event' : isStandalone ? 'New Event' : 'Schedule Activity'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, minWidth: 300 }}>
          {isStandalone ? (
            <>
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                sx={{ mt: 1 }}
              />
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={2}
                sx={{ mt: 2 }}
              />
              <DatePicker
                label="Date"
                value={eventDate}
                onChange={(newValue) => setEventDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: { mt: 2 },
                  },
                }}
              />
            </>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>{event?.title || activity?.title}</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Date: {event?.date || date}
              </Typography>
            </>
          )}

          <TimePicker
            label="Start Time"
            value={startTime}
            onChange={(newValue) => setStartTime(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: { mt: 2 },
                helperText: 'Leave empty to add to Spare Section',
              },
              field: {
                clearable: true,
              },
            }}
          />

          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={!startTime}
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={!canSave}>{isEditing ? 'Save' : isStandalone ? 'Create' : 'Schedule'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog;
