import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Button, CircularProgress
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import NavigationDrawer from '../components/NavigationDrawer';
import AppBarUserSection from '../components/AppBarUserSection';
import AcademicYearSelector from '../components/YearlyGoals/AcademicYearSelector';
import { getCurrentAcademicYear } from '../utils/academicYear';
import ObjectiveAccordion from '../components/YearlyGoals/ObjectiveAccordion';
import ObjectiveFormDialog from '../components/YearlyGoals/ObjectiveFormDialog';
import GoalEntryFormDialog from '../components/YearlyGoals/GoalEntryFormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { Objective, GoalEntry, StrategyStatus } from '../types';
import {
  getObjectives, createObjective, updateObjective, deleteObjective,
  getGoalEntries, createGoalEntry, updateGoalEntry, deleteGoalEntry,
  GoalEntryRequest,
} from '../api/goalsApi';

const YearlyGoalsPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState<number>(getCurrentAcademicYear());
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [goalEntries, setGoalEntries] = useState<GoalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Objective dialog
  const [objectiveDialogOpen, setObjectiveDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);

  // GoalEntry dialog
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GoalEntry | null>(null);
  const [activeObjectiveId, setActiveObjectiveId] = useState<string | null>(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; message: React.ReactNode; onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const objs = await getObjectives(academicYear);
      setObjectives(objs);
      if (objs.length > 0) {
        const ids = objs.map((o) => o.id);
        const entries = await getGoalEntries(ids);
        setGoalEntries(entries);
      } else {
        setGoalEntries([]);
      }
    } catch (err) {
      console.error('Failed to load goals data:', err);
    } finally {
      setLoading(false);
    }
  }, [academicYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Objective handlers ---

  const handleAddObjective = () => {
    setEditingObjective(null);
    setObjectiveDialogOpen(true);
  };

  const handleEditObjective = (obj: Objective) => {
    setEditingObjective(obj);
    setObjectiveDialogOpen(true);
  };

  const handleSaveObjective = async (data: { title: string; description: string }) => {
    if (editingObjective) {
      await updateObjective(editingObjective.id, {
        title: data.title,
        description: data.description,
        academicYear,
        sortOrder: editingObjective.sortOrder,
      });
    } else {
      await createObjective({
        title: data.title,
        description: data.description,
        academicYear,
        sortOrder: objectives.length,
      });
    }
    loadData();
  };

  const handleDeleteObjective = (obj: Objective) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Objective',
      message: `Delete "${obj.title}" and all its goals?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await deleteObjective(obj.id);
        loadData();
      },
    });
  };

  // --- GoalEntry handlers ---

  const handleAddEntry = (objectiveId: string) => {
    setEditingEntry(null);
    setActiveObjectiveId(objectiveId);
    setEntryDialogOpen(true);
  };

  const handleEditEntry = (entry: GoalEntry) => {
    setEditingEntry(entry);
    setActiveObjectiveId(entry.objectiveId);
    setEntryDialogOpen(true);
  };

  const handleSaveEntry = async (data: {
    goal: string;
    strategy: string;
    measure: string;
    endDate: string;
    importance: number;
    result: string;
    status: StrategyStatus;
  }) => {
    if (!activeObjectiveId) return;
    const payload: GoalEntryRequest = {
      objectiveId: activeObjectiveId,
      goal: data.goal,
      strategy: data.strategy,
      measure: data.measure,
      endDate: data.endDate || undefined,
      importance: data.importance,
      result: data.result,
      status: data.status,
      sortOrder: editingEntry
        ? editingEntry.sortOrder
        : goalEntries.filter((e) => e.objectiveId === activeObjectiveId).length,
    };
    if (editingEntry) {
      await updateGoalEntry(editingEntry.id, payload);
    } else {
      await createGoalEntry(payload);
    }
    loadData();
  };

  const handleDeleteEntry = (entry: GoalEntry) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Goal',
      message: 'Delete this goal?',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await deleteGoalEntry(entry.id);
        loadData();
      },
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" className="no-print">
        <Toolbar sx={{ gap: 0.5 }}>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            Yearly Goals
          </Typography>
          <AcademicYearSelector value={academicYear} onChange={setAcademicYear} />
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" onClick={() => window.print()} title="Print">
            <PrintIcon />
          </IconButton>
          <AppBarUserSection />
        </Toolbar>
      </AppBar>

      {/* Print-only header */}
      <Box className="print-only" sx={{ p: 2 }}>
        <Typography variant="h5" align="center">
          Yearly Goals {academicYear}–{academicYear + 1}
        </Typography>
      </Box>

      <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Box sx={{ p: 2, flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {objectives.map((obj) => (
              <ObjectiveAccordion
                key={obj.id}
                objective={obj}
                entries={goalEntries.filter((e) => e.objectiveId === obj.id)}
                onEditObjective={handleEditObjective}
                onDeleteObjective={handleDeleteObjective}
                onAddEntry={handleAddEntry}
                onEditEntry={handleEditEntry}
                onDeleteEntry={handleDeleteEntry}
              />
            ))}

            {objectives.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No objectives for {academicYear}–{academicYear + 1}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Start planning by adding your first objective (e.g. Maths, English, Piano).
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2 }} className="no-print">
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddObjective}>
                Add Objective
              </Button>
            </Box>
          </>
        )}
      </Box>

      <ObjectiveFormDialog
        open={objectiveDialogOpen}
        onClose={() => setObjectiveDialogOpen(false)}
        onSave={handleSaveObjective}
        objective={editingObjective}
      />

      <GoalEntryFormDialog
        open={entryDialogOpen}
        onClose={() => setEntryDialogOpen(false)}
        onSave={handleSaveEntry}
        entry={editingEntry}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      >
        {confirmDialog.message}
      </ConfirmDialog>
    </Box>
  );
};

export default YearlyGoalsPage;
