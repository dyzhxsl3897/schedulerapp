import * as XLSX from 'xlsx';
import { Objective, GoalEntry, StrategyStatus } from '../types';

const statusLabels: Record<StrategyStatus, string> = {
  [StrategyStatus.NOT_STARTED]: 'Not Started',
  [StrategyStatus.IN_PROGRESS]: 'In Progress',
  [StrategyStatus.ACHIEVED]: 'Achieved',
  [StrategyStatus.NOT_ACHIEVED]: 'Not Achieved',
};

export function exportGoalsToExcel(
  objectives: Objective[],
  goalEntries: GoalEntry[],
  academicYear: number,
): void {
  const headers = ['Objective', 'Goal', 'Strategy', 'Measure', 'EndDate', 'Importance', 'Result', 'Status'];
  const rows: (string | number)[][] = [];

  const sortedObjectives = [...objectives].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const obj of sortedObjectives) {
    const entries = goalEntries
      .filter((e) => e.objectiveId === obj.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (entries.length === 0) {
      // Still show the objective even if it has no goals
      const objectiveCell = obj.description
        ? `${obj.title}\n${obj.description}`
        : obj.title;
      rows.push([objectiveCell, '', '', '', '', '', '', '']);
    } else {
      entries.forEach((entry, idx) => {
        const objectiveCell = idx === 0
          ? (obj.description ? `${obj.title}\n${obj.description}` : obj.title)
          : '';
        const endDate = entry.endDate
          ? new Date(entry.endDate + 'T00:00:00').toLocaleDateString()
          : '';
        rows.push([
          objectiveCell,
          entry.goal || '',
          entry.strategy || '',
          entry.measure || '',
          endDate,
          entry.importance ?? '',
          entry.result || '',
          statusLabels[entry.status] || entry.status || '',
        ]);
      });
    }
  }

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 30 }, // Objective
    { wch: 25 }, // Goal
    { wch: 25 }, // Strategy
    { wch: 20 }, // Measure
    { wch: 12 }, // EndDate
    { wch: 12 }, // Importance
    { wch: 20 }, // Result
    { wch: 14 }, // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Yearly Goals');
  XLSX.writeFile(wb, `Yearly_Goals_${academicYear}-${academicYear + 1}.xlsx`);
}
