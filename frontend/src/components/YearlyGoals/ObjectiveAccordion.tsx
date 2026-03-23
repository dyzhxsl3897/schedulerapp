import React from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Typography, IconButton, Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Objective, GoalEntry } from '../../types';
import OGSMTable from './OGSMTable';

interface ObjectiveAccordionProps {
  objective: Objective;
  entries: GoalEntry[];
  onEditObjective: (objective: Objective) => void;
  onDeleteObjective: (objective: Objective) => void;
  onAddEntry: (objectiveId: string) => void;
  onEditEntry: (entry: GoalEntry) => void;
  onDeleteEntry: (entry: GoalEntry) => void;
}

const ObjectiveAccordion: React.FC<ObjectiveAccordionProps> = ({
  objective,
  entries,
  onEditObjective,
  onDeleteObjective,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}) => {
  return (
    <Accordion defaultExpanded sx={{ mb: 1 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 } }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1 }}>{objective.title}</Typography>
        <Box className="no-print" sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
          <IconButton size="small" onClick={() => onEditObjective(objective)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDeleteObjective(objective)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {objective.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {objective.description}
          </Typography>
        )}
        <OGSMTable
          entries={entries}
          onAddEntry={() => onAddEntry(objective.id)}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default ObjectiveAccordion;
