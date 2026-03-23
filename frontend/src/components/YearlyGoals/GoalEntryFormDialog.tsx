import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, MenuItem, Rating, Typography
} from '@mui/material';
import { GoalEntry, StrategyStatus } from '../../types';

interface GoalEntryFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    goal: string;
    strategy: string;
    measure: string;
    endDate: string;
    importance: number;
    result: string;
    status: StrategyStatus;
  }) => void;
  entry: GoalEntry | null;
}

const statusLabels: Record<StrategyStatus, string> = {
  [StrategyStatus.NOT_STARTED]: 'Not Started',
  [StrategyStatus.IN_PROGRESS]: 'In Progress',
  [StrategyStatus.ACHIEVED]: 'Achieved',
  [StrategyStatus.NOT_ACHIEVED]: 'Not Achieved',
};

const GoalEntryFormDialog: React.FC<GoalEntryFormDialogProps> = ({ open, onClose, onSave, entry }) => {
  const [goal, setGoal] = useState('');
  const [strategy, setStrategy] = useState('');
  const [measure, setMeasure] = useState('');
  const [endDate, setEndDate] = useState('');
  const [importance, setImportance] = useState<number>(3);
  const [result, setResult] = useState('');
  const [status, setStatus] = useState<StrategyStatus>(StrategyStatus.NOT_STARTED);

  useEffect(() => {
    if (entry) {
      setGoal(entry.goal || '');
      setStrategy(entry.strategy || '');
      setMeasure(entry.measure || '');
      setEndDate(entry.endDate || '');
      setImportance(entry.importance || 3);
      setResult(entry.result || '');
      setStatus(entry.status || StrategyStatus.NOT_STARTED);
    } else {
      setGoal('');
      setStrategy('');
      setMeasure('');
      setEndDate('');
      setImportance(3);
      setResult('');
      setStatus(StrategyStatus.NOT_STARTED);
    }
  }, [entry, open]);

  const handleSave = () => {
    if (!goal.trim()) return;
    onSave({ goal: goal.trim(), strategy, measure, endDate, importance, result, status });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{entry ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Strategy"
            multiline
            rows={2}
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Measure"
            multiline
            rows={2}
            value={measure}
            onChange={(e) => setMeasure(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography component="legend" variant="body2" sx={{ mb: 0.5 }}>
              Importance
            </Typography>
            <Rating
              value={importance}
              onChange={(_, newValue) => setImportance(newValue || 1)}
              max={5}
            />
          </Box>
          <TextField
            fullWidth
            label="Result"
            multiline
            rows={2}
            value={result}
            onChange={(e) => setResult(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StrategyStatus)}
          >
            {Object.values(StrategyStatus).map((s) => (
              <MenuItem key={s} value={s}>{statusLabels[s]}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!goal.trim()}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoalEntryFormDialog;
