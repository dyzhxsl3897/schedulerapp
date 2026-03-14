import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Paper, Typography, IconButton, Box } from '@mui/material';
import { Activity } from '../types';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

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

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Paper 
        elevation={isDragging ? 6 : 1}
        sx={{ mb: 1, p: 1, cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
        onClick={() => onSelect(activity)}
      >
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>
            <Typography variant="body2" fontWeight="bold">{activity.title}</Typography>
            <Typography variant="caption" color="textSecondary">{activity.priority}</Typography>
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
}

const ActivityList: React.FC<ActivityListProps> = ({ activities, onEdit, onDelete, onSelect }) => {
  return (
    <Box sx={{ height: '45vh', overflowY: 'auto', p: 1 }}>
      <Typography variant="h6" gutterBottom>Activities</Typography>
      {activities.length === 0 ? (
        <Typography variant="body2" color="textSecondary">No activities. Create one!</Typography>
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
  );
};

export default ActivityList;
