import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Paper, Typography, IconButton, Box, Button } from '@mui/material';
import { Activity } from '../types';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

function getPriorityColors(priority?: string): { backgroundColor: string; borderColor: string } {
  switch (priority) {
    case 'HIGH':
      return { backgroundColor: '#fce4ec', borderColor: '#e53935' };
    case 'MEDIUM':
      return { backgroundColor: '#fff3e0', borderColor: '#ff9800' };
    case 'LOW':
      return { backgroundColor: '#e8f5e9', borderColor: '#4caf50' };
    default:
      return { backgroundColor: '#e3f2fd', borderColor: '#2196f3' };
  }
}

interface ActivityItemProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onSelect: (activity: Activity) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onEdit, onDelete, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `activity-${activity.id}`,
    data: { activity },
  });

  const colors = getPriorityColors(activity.priority);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Paper
        elevation={isDragging ? 6 : 1}
        sx={{
          mb: 1,
          p: 1,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          backgroundColor: colors.backgroundColor,
          border: `1px solid ${colors.borderColor}`,
          borderLeft: `4px solid ${colors.borderColor}`,
        }}
        onClick={() => onSelect(activity)}
      >
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>
            <Typography variant="body2" fontWeight="bold" fontSize="0.8rem">{activity.title}</Typography>
          </Box>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(activity); }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </div>
  );
};

interface ActivityListProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onSelect: (activity: Activity) => void;
  onNew: () => void;
}

const ActivityList: React.FC<ActivityListProps> = ({ activities, onEdit, onDelete, onSelect, onNew }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Box sx={{ px: 1, pt: 1, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight="bold">Activities</Typography>
        <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={onNew}>
          New
        </Button>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1, pb: 1 }}>
        {activities.length === 0 ? (
          <Typography variant="body2" color="textSecondary" fontSize="0.8rem">No activities. Create one!</Typography>
        ) : (
          activities.map(activity => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default ActivityList;
