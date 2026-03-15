import React from 'react';
import { Box, Typography, Paper, Divider, Chip, IconButton, Checkbox } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Activity, ScheduledEvent } from '../types';

interface ActivityDetailsProps {
  item: Activity | ScheduledEvent | null;
  onDeleteEvent?: (id: string) => void;
  onEditEvent?: (event: ScheduledEvent) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({ item, onDeleteEvent, onEditEvent, onToggleComplete }) => {
  if (!item) {
    return (
      <Box sx={{ p: 2, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Typography variant="h6" gutterBottom>Details</Typography>
        <Typography variant="body2" color="textSecondary">Select an activity or event to see details.</Typography>
      </Box>
    );
  }

  const isActivity = 'priority' in item;

  return (
    <Box sx={{ p: 2, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <Typography variant="h6" gutterBottom>Details</Typography>
      <Paper elevation={0} variant="outlined" sx={{ p: 2, position: 'relative' }}>
        {!isActivity && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
            {onEditEvent && (
              <IconButton size="small" onClick={() => onEditEvent(item as ScheduledEvent)}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {onDeleteEvent && (
              <IconButton size="small" color="error" onClick={() => onDeleteEvent(item.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
        <Typography variant="h6">{item.title}</Typography>
        <Chip
          label={isActivity ? 'Activity Template' : 'Scheduled Event'}
          size="small"
          color={isActivity ? 'primary' : 'secondary'}
          sx={{ mb: 1 }}
        />

        {isActivity && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="textSecondary">Priority: </Typography>
            <Typography variant="body2">{item.priority}</Typography>
          </Box>
        )}

        {!isActivity && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="textSecondary">Scheduled: </Typography>
            <Typography variant="body2">{item.date} {item.startTime || '(No time)'}</Typography>
            {item.durationMinutes && (
                <Typography variant="body2">Duration: {item.durationMinutes} mins</Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {onToggleComplete && (
                <Checkbox
                  size="small"
                  checked={item.isCompleted}
                  onChange={() => onToggleComplete(item.id, !item.isCompleted)}
                  sx={{ p: 0, mr: 0.5 }}
                />
              )}
              <Chip
                  label={item.isCompleted ? 'Completed' : 'Pending'}
                  size="small"
                  variant="outlined"
                  color={item.isCompleted ? 'info' : 'warning'}
              />
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 1 }} />
        
        <Typography variant="caption" color="textSecondary">Description:</Typography>
        <Typography variant="body2">
          {isActivity ? item.description : 'Details for scheduled instance...'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ActivityDetails;
