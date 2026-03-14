import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, MenuItem 
} from '@mui/material';
import { Activity, Priority } from '../types';

interface ActivityFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Activity>) => void;
  activity: Activity | null;
}

const ActivityFormDialog: React.FC<ActivityFormDialogProps> = ({ open, onClose, onSave, activity }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description);
      setPriority(activity.priority);
    } else {
      setTitle('');
      setDescription('');
      setPriority(Priority.MEDIUM);
    }
  }, [activity, open]);

  const handleSave = () => {
    onSave({ title, description, priority });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{activity ? 'Edit Activity' : 'Create Activity'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <MenuItem value={Priority.LOW}>Low</MenuItem>
            <MenuItem value={Priority.MEDIUM}>Medium</MenuItem>
            <MenuItem value={Priority.HIGH}>High</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityFormDialog;
