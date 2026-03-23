import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box
} from '@mui/material';
import { Objective } from '../../types';

interface ObjectiveFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description: string }) => void;
  objective: Objective | null;
}

const ObjectiveFormDialog: React.FC<ObjectiveFormDialogProps> = ({ open, onClose, onSave, objective }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (objective) {
      setTitle(objective.title);
      setDescription(objective.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [objective, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{objective ? 'Edit Objective' : 'Add Objective'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Title (e.g. 数学, English, Piano)"
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
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!title.trim()}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ObjectiveFormDialog;
