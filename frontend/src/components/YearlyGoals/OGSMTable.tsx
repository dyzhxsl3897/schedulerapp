import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Rating, Chip, IconButton, Button, Box, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { GoalEntry, StrategyStatus } from '../../types';

interface OGSMTableProps {
  entries: GoalEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: GoalEntry) => void;
  onDeleteEntry: (entry: GoalEntry) => void;
}

const statusConfig: Record<StrategyStatus, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  [StrategyStatus.NOT_STARTED]: { label: 'Not Started', color: 'default' },
  [StrategyStatus.IN_PROGRESS]: { label: 'In Progress', color: 'info' },
  [StrategyStatus.ACHIEVED]: { label: 'Achieved', color: 'success' },
  [StrategyStatus.NOT_ACHIEVED]: { label: 'Not Achieved', color: 'error' },
};

const OGSMTable: React.FC<OGSMTableProps> = ({ entries, onAddEntry, onEditEntry, onDeleteEntry }) => {
  return (
    <Box>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
        <Table size="small" className="goals-print-table">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Goal</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Strategy</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Measure</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Importance</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} className="no-print">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No goals yet. Click "Add Goal" to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const sc = statusConfig[entry.status] || statusConfig[StrategyStatus.NOT_STARTED];
                return (
                  <TableRow key={entry.id} hover>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', maxWidth: 200 }}>{entry.goal}</TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', maxWidth: 200 }}>{entry.strategy}</TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', maxWidth: 200 }}>{entry.measure}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {entry.endDate ? new Date(entry.endDate + 'T00:00:00').toLocaleDateString() : ''}
                    </TableCell>
                    <TableCell>
                      <Rating value={entry.importance} readOnly size="small" max={5} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', maxWidth: 200 }}>{entry.result}</TableCell>
                    <TableCell>
                      <Chip label={sc.label} color={sc.color} size="small" />
                    </TableCell>
                    <TableCell className="no-print">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => onEditEntry(entry)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => onDeleteEntry(entry)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        startIcon={<AddIcon />}
        size="small"
        onClick={onAddEntry}
        className="no-print"
      >
        Add Goal
      </Button>
    </Box>
  );
};

export default OGSMTable;
