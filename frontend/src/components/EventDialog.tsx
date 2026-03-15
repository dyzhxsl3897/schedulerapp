import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, Typography 
} from '@mui/material';
import { Activity, ScheduledEvent } from '../types';

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { startTime?: string, durationMinutes?: number }) => void;
  activity: Activity | null;
  date: string | null;
  event?: ScheduledEvent | null;
}

const EventDialog: React.FC<EventDialogProps> = ({ open, onClose, onSave, activity, date, event }) => {
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');

  const isEditing = !!event;

  useEffect(() => {
    if (open) {
      if (event) {
        setStartTime(event.startTime ? event.startTime.substring(0, 5) : '');
        setDuration(event.durationMinutes?.toString() || '60');
      } else {
        setStartTime('');
        setDuration('60');
      }
    }
  }, [open, event]);

  const handleSave = () => {
    onSave({
      startTime: startTime || undefined,
      durationMinutes: startTime ? parseInt(duration) : undefined
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{isEditing ? 'Edit Event' : 'Schedule Activity'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, minWidth: 300 }}>
          <Typography variant="subtitle1" gutterBottom>{event?.title || activity?.title}</Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Date: {event?.date || date}
          </Typography>
          
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
        <Button onClick={handleSave} variant="contained" color="primary">{isEditing ? 'Save' : 'Schedule'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog;
