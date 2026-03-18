import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, Typography, Button, AppBar, Toolbar, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import PrintIcon from '@mui/icons-material/Print';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Activity, ScheduledEvent } from '../types';
import WeekScheduler from '../components/WeekScheduler';
import ActivityList from '../components/ActivityList';
import ActivityDetails from '../components/ActivityDetails';
import EventDialog from '../components/EventDialog';
import ActivityFormDialog from '../components/ActivityFormDialog';
import GoogleCalendarButton from '../components/GoogleCalendarButton';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

const DashboardPage: React.FC = () => {
  const { logout, user } = useAuth();
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ activity: Activity; affectedEvents: ScheduledEvent[] } | null>(null);

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
    if (over && over.id.toString().startsWith('day-')) {
      const activityId = active.id.toString().replace('activity-', '');
      const activity = activities.find(a => a.id === activityId);
      const dateStr = over.data.current?.date;
      
      if (activity && dateStr) {
        setDroppedActivity(activity);
        setDroppedDate(dateStr);
        setEventDialogOpen(true);
      }
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
        durationMinutes: data.durationMinutes
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
        isCompleted: completed
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
        isCompleted: editingEvent.isCompleted
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" className="no-print">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Weekly Scheduler - Welcome, {user?.username}
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Typography
        variant="h5"
        className="print-only"
        sx={{ textAlign: 'center', fontWeight: 'bold', pt: 2 }}
      >
        {user?.username}'s Weekly Schedule
      </Typography>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <Grid container spacing={2} sx={{ p: 2, alignItems: 'flex-start', justifyContent: 'center' }}>
          {/* Left: Scheduler */}
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1, gap: 1, position: 'relative' }}>
              <IconButton onClick={() => setCurrentDate(d => subWeeks(d, 1))} size="small" className="no-print">
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="subtitle1" sx={{ minWidth: 180, textAlign: 'center', fontWeight: 'bold' }}>
                {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </Typography>
              <IconButton onClick={() => setCurrentDate(d => addWeeks(d, 1))} size="small" className="no-print">
                <ChevronRightIcon />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                startIcon={<TodayIcon />}
                onClick={() => setCurrentDate(new Date())}
                className="no-print"
              >
                Today
              </Button>
              <IconButton onClick={() => window.print()} size="small" className="no-print" title="Print weekly planner" sx={{ position: 'absolute', right: 0 }}>
                <PrintIcon />
              </IconButton>
              <span className="no-print">
                <GoogleCalendarButton
                  weekStart={format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')}
                  weekEnd={format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')}
                  onSyncComplete={fetchEvents}
                />
              </span>
            </Box>
            <WeekScheduler
              currentDate={currentDate}
              events={events}
              onToggleComplete={handleToggleEventComplete}
              onSelectEvent={setSelectedItem}
              onDeleteEvent={handleDeleteEvent}
            />
          </Grid>

          {/* Right: Panels */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }} className="no-print">
            <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">Backlog</Typography>
                <Button 
                    startIcon={<AddIcon />} 
                    size="small" 
                    variant="outlined"
                    onClick={() => { setEditingActivity(null); setActivityFormOpen(true); }}
                >
                  New
                </Button>
              </Box>
              
              <ActivityList 
                activities={activities} 
                onEdit={(a) => { setEditingActivity(a); setActivityFormOpen(true); }}
                onDelete={handleDeleteActivity}
                onSelect={setSelectedItem}
              />
              
              <Box sx={{ borderTop: '2px solid #eee', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <ActivityDetails
                  item={selectedItem}
                  onDeleteEvent={handleDeleteEvent}
                  onEditEvent={handleEditEvent}
                  onToggleComplete={handleToggleEventComplete}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DndContext>

      {/* Dialogs */}
      <EventDialog
        open={eventDialogOpen}
        onClose={() => { setEventDialogOpen(false); setEditingEvent(null); }}
        onSave={editingEvent ? handleUpdateEvent : handleSaveEvent}
        activity={droppedActivity}
        date={droppedDate}
        event={editingEvent}
      />
      
      <ActivityFormDialog
        open={activityFormOpen}
        onClose={() => setActivityFormOpen(false)}
        onSave={handleSaveActivity}
        activity={editingActivity}
      />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Activity</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteConfirm?.activity.title}</strong>?
          </Typography>
          {deleteConfirm && deleteConfirm.affectedEvents.length > 0 && (
            <>
              <Typography variant="body2" sx={{ mt: 1 }}>
                The following scheduled events will also be deleted:
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
                Note: Only this week's events are shown above. All events for this activity will be deleted.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={confirmDeleteActivity} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;
