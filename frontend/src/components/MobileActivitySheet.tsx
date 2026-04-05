import React, { useState } from 'react';
import { Box, Typography, SwipeableDrawer, IconButton, Tabs, Tab } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Activity, ScheduledEvent } from '../types';
import ActivityList from './ActivityList';
import ActivityDetails from './ActivityDetails';

interface MobileActivitySheetProps {
  activities: Activity[];
  selectedItem: Activity | ScheduledEvent | null;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (id: string) => void;
  onSelectItem: (item: Activity | ScheduledEvent) => void;
  onNewActivity: () => void;
  onNewEvent: () => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (event: ScheduledEvent) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

const PEEK_HEIGHT = 56;

const MobileActivitySheet: React.FC<MobileActivitySheetProps> = ({
  activities,
  selectedItem,
  onEditActivity,
  onDeleteActivity,
  onSelectItem,
  onNewActivity,
  onNewEvent,
  onDeleteEvent,
  onEditEvent,
  onToggleComplete,
}) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  return (
    <>
      {/* Peek bar - always visible */}
      <Box
        onClick={() => setOpen(true)}
        className="no-print"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: PEEK_HEIGHT,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          cursor: 'pointer',
          zIndex: 1100,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <KeyboardArrowUpIcon />
        <Typography variant="body2" fontWeight="bold">
          Activities ({activities.length})
        </Typography>
      </Box>

      {/* Expandable bottom sheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            maxHeight: '75vh',
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
          },
        }}
      >
        {/* Pull handle */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pt: 1,
            pb: 0.5,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'grey.400',
            }}
          />
        </Box>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pb: 0.5 }}>
          <Typography variant="h6" fontWeight="bold">Activities</Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <KeyboardArrowDownIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0 } }}
        >
          <Tab label="List" />
          <Tab label="Details" />
        </Tabs>

        {/* Content */}
        <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 200, maxHeight: 'calc(75vh - 120px)' }}>
          {tab === 0 && (
            <ActivityList
              activities={activities}
              onEdit={onEditActivity}
              onDelete={onDeleteActivity}
              onSelect={(item) => { onSelectItem(item); setTab(1); }}
              onNew={onNewActivity}
              onNewEvent={onNewEvent}
            />
          )}
          {tab === 1 && (
            <ActivityDetails
              item={selectedItem}
              onDeleteEvent={onDeleteEvent}
              onEditEvent={onEditEvent}
              onToggleComplete={onToggleComplete}
            />
          )}
        </Box>
      </SwipeableDrawer>
    </>
  );
};

export default MobileActivitySheet;
