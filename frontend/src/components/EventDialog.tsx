import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography
} from '@mui/material';
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
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');

  const isEditing = !!event;
  const isStandalone = !activity && !event;

  useEffect(() => {
    if (open) {
      if (event) {
        setStartTime(event.startTime ? event.startTime.substring(0, 5) : '');
        setDuration(event.durationMinutes?.toString() || '60');
      } else {
        setStartTime('');
        setDuration('60');
      }
      setTitle('');
      setDescription('');
      setEventDate('');
    }
  }, [open, event]);

  const handleSave = () => {
    if (isStandalone) {
      onSave({
        title: title,
        description: description || undefined,
        date: eventDate,
        startTime: startTime || undefined,
        durationMinutes: startTime ? parseInt(duration) : undefined,
      });
    } else {
      onSave({
        startTime: startTime || undefined,
        durationMinutes: startTime ? parseInt(duration) : undefined,
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
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                sx={{ mt: 2 }}
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
          
          <TextField
            fullWidth
            label="Start Time (HH:mm)"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
            helperText="Leave empty to add to Spare Section"
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
