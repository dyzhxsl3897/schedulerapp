import React from 'react';
import { Box, Typography, Paper, Divider, Chip, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Activity, ScheduledEvent } from '../types';

interface ActivityDetailsProps {
  item: Activity | ScheduledEvent | null;
  onDeleteEvent?: (id: string) => void;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = ({ item, onDeleteEvent }) => {
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
      <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
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
            <Chip
                label={item.isCompleted ? 'Completed' : 'Pending'}
                size="small"
                variant="outlined"
                color={item.isCompleted ? 'success' : 'warning'}
                sx={{ mt: 1 }}
            />
            {onDeleteEvent && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => onDeleteEvent(item.id)}
                sx={{ mt: 1 }}
              >
                Delete Event
              </Button>
            )}
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
