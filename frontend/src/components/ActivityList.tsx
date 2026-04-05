import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Paper, Typography, IconButton, Box, Button } from '@mui/material';
import { Activity } from '../types';
import { getPriorityColors } from '../utils/priority';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

interface ActivityItemProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onSelect: (activity: Activity) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onEdit, onDelete, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `activity-${activity.id}`,
    data: { activity },
  });

  const colors = getPriorityColors(activity.priority);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

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
  onNewEvent: () => void;
}

const ActivityList: React.FC<ActivityListProps> = ({ activities, onEdit, onDelete, onSelect, onNew, onNewEvent }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Box sx={{ px: 1, pt: 1, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight="bold">Activities</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={onNew}>
            Activity
          </Button>
          <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={onNewEvent}>
            Event
          </Button>
        </Box>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1, pb: 1 }}>
        {activities.length === 0 ? (
          <Typography variant="body2" color="textSecondary" fontSize="0.8rem">No activities. Create one!</Typography>
        ) : (
          <SortableContext items={activities.map(a => `activity-${a.id}`)} strategy={verticalListSortingStrategy}>
            {activities.map(activity => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onEdit={onEdit}
                onDelete={onDelete}
                onSelect={onSelect}
              />
            ))}
          </SortableContext>
        )}
      </Box>
    </Box>
  );
};

export default ActivityList;
