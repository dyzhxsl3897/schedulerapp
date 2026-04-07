import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, Typography, Button, AppBar, Toolbar, IconButton,
    List, ListItem, ListItemText, Menu, MenuItem, ListItemIcon, SpeedDial, SpeedDialAction
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import PrintIcon from '@mui/icons-material/Print';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Activity, ScheduledEvent } from '../types';
import WeekScheduler from '../components/WeekScheduler';
import ActivityList from '../components/ActivityList';
import ActivityDetails from '../components/ActivityDetails';
import EventDialog from '../components/EventDialog';
import ActivityFormDialog from '../components/ActivityFormDialog';
import GoogleCalendarButton from '../components/GoogleCalendarButton';
import MobileActivitySheet from '../components/MobileActivitySheet';
import ConfirmDialog from '../components/ConfirmDialog';
import NavigationDrawer from '../components/NavigationDrawer';
import AppBarUserSection from '../components/AppBarUserSection';
import { useIsMobile } from '../hooks/useIsMobile';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [selectedItem, setSelectedItem] = useState<Activity | ScheduledEvent | null>(null);

  // Dialog states
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  // Drag drop temp state
  const [droppedActivity, setDroppedActivity] = useState<Activity | null>(null);
  const [droppedDate, setDroppedDate] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
  const [newEventDialogOpen, setNewEventDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ activity: Activity; affectedEvents: ScheduledEvent[] } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clearWeekConfirmOpen, setClearWeekConfirmOpen] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    fetchActivities();
    fetchEvents();
  }, [currentDate]);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      setActivities(res.data);
    } catch (err) {
      console.error('Failed to fetch activities', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const start = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const res = await api.get(`/events?start=${start}&end=${end}`);
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Existing behavior: drag activity onto a day column to schedule
    if (overId.startsWith('day-')) {
      const activityId = activeId.replace('activity-', '');
      const activity = activities.find(a => a.id === activityId);
      const dateStr = over.data.current?.date;

      if (activity && dateStr) {
        setDroppedActivity(activity);
        setDroppedDate(dateStr);
        setEventDialogOpen(true);
      }
      return;
    }

    // Reorder within activity list
    if (activeId.startsWith('activity-') && overId.startsWith('activity-')) {
      const oldId = activeId.replace('activity-', '');
      const newId = overId.replace('activity-', '');
      if (oldId === newId) return;

      const oldIndex = activities.findIndex(a => a.id === oldId);
      const newIndex = activities.findIndex(a => a.id === newId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(activities, oldIndex, newIndex);
      setActivities(reordered);

      const reorderPayload = reordered.map((a, index) => ({ id: a.id, sortOrder: index }));
      api.put('/activities/reorder', reorderPayload).catch(err => {
        console.error('Failed to reorder activities', err);
        fetchActivities();
      });
    }
  };

  const handleSaveEvent = async (data: { startTime?: string, durationMinutes?: number }) => {
    if (!droppedActivity || !droppedDate) return;

    try {
      // Backend expects start_time as HH:mm:ss
      const startTimeFormatted = data.startTime ? `${data.startTime}:00` : null;

      await api.post('/events', {
        title: droppedActivity.title,
        activityId: droppedActivity.id,
        date: droppedDate,
        startTime: startTimeFormatted,
        durationMinutes: data.durationMinutes,
      });
      fetchEvents();
    } catch (err) {
      console.error('Failed to save event', err);
    }
  };

  const handleToggleEventComplete = async (id: string, completed: boolean) => {
    try {
      const event = events.find(e => e.id === id);
      if (!event) return;
      
      await api.put(`/events/${id}`, {
        title: event.title,
        description: event.description,
        activityId: event.activityId,
        date: event.date,
        startTime: event.startTime,
        durationMinutes: event.durationMinutes,
        isCompleted: completed,
      });
      await fetchEvents();
      // Update selectedItem if the toggled event is currently selected
      if (selectedItem && 'date' in selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, isCompleted: completed } as ScheduledEvent);
      }
    } catch (err) {
      console.error('Failed to toggle event', err);
    }
  };

  const handleSaveActivity = async (data: Partial<Activity>) => {
    try {
      if (editingActivity) {
        await api.put(`/activities/${editingActivity.id}`, data);
      } else {
        await api.post('/activities', data);
      }
      fetchActivities();
      fetchEvents();
    } catch (err) {
      console.error('Failed to save activity', err);
    }
  };

  const handleDeleteActivity = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;
    const affectedEvents = events.filter(e => e.activityId === id);
    setDeleteConfirm({ activity, affectedEvents });
  };

  const confirmDeleteActivity = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/activities/${deleteConfirm.activity.id}`);
      fetchActivities();
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete activity', err);
    }
    setDeleteConfirm(null);
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await api.delete(`/events/${id}`);
      setSelectedItem(prev => prev && 'date' in prev && prev.id === id ? null : prev);
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const handleClearWeek = async () => {
    try {
      const start = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      await api.delete(`/events?start=${start}&end=${end}`);
      setSelectedItem(prev => prev && 'date' in prev ? null : prev);
      fetchEvents();
    } catch (err) {
      console.error('Failed to clear week events', err);
    } finally {
      setClearWeekConfirmOpen(false);
    }
  };

  const handleEditEvent = (event: ScheduledEvent) => {
    setEditingEvent(event);
    setEventDialogOpen(true);
  };

  const handleUpdateEvent = async (data: { startTime?: string, durationMinutes?: number }) => {
    if (!editingEvent) return;
    try {
      const startTimeFormatted = data.startTime ? `${data.startTime}:00` : null;
      await api.put(`/events/${editingEvent.id}`, {
        title: editingEvent.title,
        description: editingEvent.description,
        activityId: editingEvent.activityId,
        date: editingEvent.date,
        startTime: startTimeFormatted,
        durationMinutes: data.durationMinutes,
        isCompleted: editingEvent.isCompleted,
      });
      fetchEvents();
      // Update selectedItem if it's the event we just edited
      if (selectedItem && 'date' in selectedItem && selectedItem.id === editingEvent.id) {
        const res = await api.get(`/events?start=${editingEvent.date}&end=${editingEvent.date}`);
        const updated = res.data.find((e: ScheduledEvent) => e.id === editingEvent.id);
        if (updated) setSelectedItem(updated);
      }
    } catch (err) {
      console.error('Failed to update event', err);
    }
  };

  const handleSaveNewEvent = async (data: { title?: string, description?: string, date?: string, startTime?: string, durationMinutes?: number }) => {
    if (!data.title || !data.date) return;
    try {
      const startTimeFormatted = data.startTime ? `${data.startTime}:00` : null;
      await api.post('/events', {
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: startTimeFormatted,
        durationMinutes: data.durationMinutes,
      });
      fetchEvents();
    } catch (err) {
      console.error('Failed to create event', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" className="no-print">
        <Toolbar sx={{ gap: 0.5, minHeight: isMobile ? 48 : undefined }}>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: isMobile ? 0 : 1 }}>
            <MenuIcon />
          </IconButton>
          {!isMobile && (
            <Typography variant="h6" component="div" sx={{ mr: 2 }}>
              Weekly Scheduler
            </Typography>
          )}
          <IconButton color="inherit" onClick={() => setCurrentDate(d => subWeeks(d, 1))} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant={isMobile ? 'body2' : 'subtitle1'}
            sx={{ minWidth: isMobile ? 'auto' : 180, textAlign: 'center', fontWeight: 'bold', color: 'inherit', whiteSpace: 'nowrap' }}
          >
            {isMobile
              ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd')}`
              : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
            }
          </Typography>
          <IconButton color="inherit" onClick={() => setCurrentDate(d => addWeeks(d, 1))} size="small">
            <ChevronRightIcon />
          </IconButton>
          {isMobile ? (
            <IconButton color="inherit" onClick={() => setCurrentDate(new Date())} size="small" title="Today">
              <TodayIcon />
            </IconButton>
          ) : (
            <Button color="inherit" size="small" startIcon={<TodayIcon />} onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          )}
          {!isMobile && (
            <>
              <GoogleCalendarButton
                weekStart={format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')}
                weekEnd={format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')}
                onSyncComplete={fetchEvents}
              />
              <IconButton color="inherit" onClick={() => setClearWeekConfirmOpen(true)} size="small" title="Clear all events this week">
                <DeleteSweepIcon />
              </IconButton>
              <IconButton color="inherit" onClick={() => window.print()} size="small" title="Print weekly planner">
                <PrintIcon />
              </IconButton>
            </>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {isMobile ? (
            <IconButton color="inherit" onClick={(e) => setMoreMenuAnchor(e.currentTarget)} size="small">
              <MoreVertIcon />
            </IconButton>
          ) : (
            <AppBarUserSection />
          )}
        </Toolbar>
      </AppBar>
      {/* Mobile overflow menu */}
      {isMobile && (
        <Menu
          anchorEl={moreMenuAnchor}
          open={Boolean(moreMenuAnchor)}
          onClose={() => setMoreMenuAnchor(null)}
        >
          <Box sx={{ px: 1, py: 0.5 }}>
            <GoogleCalendarButton
              weekStart={format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')}
              weekEnd={format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')}
              onSyncComplete={() => { fetchEvents(); setMoreMenuAnchor(null); }}
            />
          </Box>
          <MenuItem onClick={() => { setClearWeekConfirmOpen(true); setMoreMenuAnchor(null); }}>
            <ListItemIcon><DeleteSweepIcon fontSize="small" /></ListItemIcon>
            Clear Week
          </MenuItem>
          <MenuItem onClick={() => { window.print(); setMoreMenuAnchor(null); }}>
            <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
            Print
          </MenuItem>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 0.5, pt: 0.5, px: 1 }}>
            <AppBarUserSection />
          </Box>
        </Menu>
      )}

      <Typography
        variant="h5"
        className="print-only"
        sx={{ textAlign: 'center', fontWeight: 'bold', pt: 2 }}
      >
        {user?.username}'s Weekly Schedule
      </Typography>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <Grid container spacing={isMobile ? 1 : 2} sx={{ p: isMobile ? 1 : 2, alignItems: 'flex-start', justifyContent: 'center' }}>
          {/* Left: Scheduler */}
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <WeekScheduler
              currentDate={currentDate}
              events={events}
              onToggleComplete={handleToggleEventComplete}
              onSelectEvent={setSelectedItem}
              onDeleteEvent={handleDeleteEvent}
              selectedActivityId={selectedItem ? ('date' in selectedItem ? (selectedItem as ScheduledEvent).activityId : selectedItem.id) : undefined}
            />
          </Grid>

          {/* Right: Panels (desktop only) */}
          {!isMobile && (
            <Grid size={{ xs: 12, md: 4, lg: 3 }} className="no-print">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: 'calc(100vh - 88px)' }}>
                <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '50%', minHeight: 0 }}>
                  <ActivityList
                    activities={activities}
                    onEdit={(a) => { setEditingActivity(a); setActivityFormOpen(true); }}
                    onDelete={handleDeleteActivity}
                    onSelect={setSelectedItem}
                    onNew={() => { setEditingActivity(null); setActivityFormOpen(true); }}
                    onNewEvent={() => setNewEventDialogOpen(true)}
                  />
                </Paper>

                <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '50%', minHeight: 0, overflow: 'hidden' }}>
                  <ActivityDetails
                    item={selectedItem}
                    onDeleteEvent={handleDeleteEvent}
                    onEditEvent={handleEditEvent}
                    onToggleComplete={handleToggleEventComplete}
                  />
                </Paper>
              </Box>
            </Grid>
          )}
        </Grid>

      {/* Mobile: Bottom sheet for activities */}
      {isMobile && (
        <MobileActivitySheet
          activities={activities}
          selectedItem={selectedItem}
          onEditActivity={(a) => { setEditingActivity(a); setActivityFormOpen(true); }}
          onDeleteActivity={handleDeleteActivity}
          onSelectItem={setSelectedItem}
          onNewActivity={() => { setEditingActivity(null); setActivityFormOpen(true); }}
          onNewEvent={() => setNewEventDialogOpen(true)}
          onDeleteEvent={handleDeleteEvent}
          onEditEvent={handleEditEvent}
          onToggleComplete={handleToggleEventComplete}
        />
      )}
      </DndContext>

      {/* Mobile: Speed Dial FAB */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Quick actions"
          sx={{ position: 'fixed', bottom: 72, right: 16 }}
          icon={<AddIcon />}
          className="no-print"
        >
          <SpeedDialAction
            icon={<FitnessCenterIcon />}
            tooltipTitle="New Activity"
            onClick={() => { setEditingActivity(null); setActivityFormOpen(true); }}
          />
          <SpeedDialAction
            icon={<EventIcon />}
            tooltipTitle="New Event"
            onClick={() => setNewEventDialogOpen(true)}
          />
        </SpeedDial>
      )}

      {/* Print-only: Activity Description (second page) */}
      <Box className="print-only print-descriptions">
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
          Activity Description
        </Typography>
        <Box className="print-descriptions-list">
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: 0 }}>
            {activities.map((activity) => (
              <li key={activity.id} style={{ marginBottom: '12px', breakInside: 'avoid' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.3 }}>
                  {activity.title}
                </Typography>
                {activity.description && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1, whiteSpace: 'pre-line' }}>
                    {activity.description}
                  </Typography>
                )}
              </li>
            ))}
          </ul>
        </Box>
      </Box>

      {/* Dialogs */}
      <EventDialog
        open={eventDialogOpen}
        onClose={() => { setEventDialogOpen(false); setEditingEvent(null); }}
        onSave={editingEvent ? handleUpdateEvent : handleSaveEvent}
        activity={droppedActivity}
        date={droppedDate}
        event={editingEvent}
      />

      <EventDialog
        open={newEventDialogOpen}
        onClose={() => setNewEventDialogOpen(false)}
        onSave={handleSaveNewEvent}
        activity={null}
        date={null}
      />
      
      <ActivityFormDialog
        open={activityFormOpen}
        onClose={() => setActivityFormOpen(false)}
        onSave={handleSaveActivity}
        activity={editingActivity}
      />

      <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ConfirmDialog
        open={clearWeekConfirmOpen}
        title="Clear Week"
        confirmLabel="Clear"
        onConfirm={handleClearWeek}
        onCancel={() => setClearWeekConfirmOpen(false)}
      >
        <Typography>
          Are you sure you want to delete all events for the week of{' '}
          <strong>
            {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} –{' '}
            {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
          </strong>?
        </Typography>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Activity"
        onConfirm={confirmDeleteActivity}
        onCancel={() => setDeleteConfirm(null)}
      >
        <Typography>
          Are you sure you want to delete <strong>{deleteConfirm?.activity.title}</strong>?
        </Typography>
        {deleteConfirm && deleteConfirm.affectedEvents.length > 0 && (
          <>
            <Typography variant="body2" sx={{ mt: 1 }}>
              The following scheduled events will be kept as standalone events (they will lose this activity's color and priority):
            </Typography>
            <List dense>
              {deleteConfirm.affectedEvents.map(e => (
                <ListItem key={e.id}>
                  <ListItemText
                    primary={`${e.date} — ${e.title}`}
                    secondary={e.startTime ? `${e.startTime.substring(0, 5)} (${e.durationMinutes}m)` : 'No time set'}
                  />
                </ListItem>
              ))}
            </List>
            <Typography variant="caption" color="textSecondary">
              Note: Only this week's events are shown above. Events from other weeks will also be kept.
            </Typography>
          </>
        )}
      </ConfirmDialog>
    </Box>
  );
};

export default DashboardPage;
