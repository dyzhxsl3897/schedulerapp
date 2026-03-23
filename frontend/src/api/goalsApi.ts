import api from './axios';
import { Objective, GoalEntry, StrategyStatus } from '../types';

// --- Objective ---

export interface ObjectiveRequest {
  title: string;
  description?: string;
  academicYear: number;
  sortOrder?: number;
}

export const getObjectives = async (academicYear: number): Promise<Objective[]> => {
  const response = await api.get('/objectives', { params: { academicYear } });
  return response.data;
};

export const createObjective = async (data: ObjectiveRequest): Promise<Objective> => {
  const response = await api.post('/objectives', data);
  return response.data;
};

export const updateObjective = async (id: string, data: ObjectiveRequest): Promise<Objective> => {
  const response = await api.put(`/objectives/${id}`, data);
  return response.data;
};

export const deleteObjective = async (id: string): Promise<void> => {
  await api.delete(`/objectives/${id}`);
};

// --- GoalEntry ---

export interface GoalEntryRequest {
  objectiveId: string;
  goal: string;
  strategy?: string;
  measure?: string;
  endDate?: string;
  importance?: number;
  result?: string;
  status?: StrategyStatus;
  sortOrder?: number;
}

export const getGoalEntries = async (objectiveIds: string[]): Promise<GoalEntry[]> => {
  if (objectiveIds.length === 0) return [];
  const response = await api.get('/goal-entries', { params: { objectiveIds: objectiveIds.join(',') } });
  return response.data;
};

export const createGoalEntry = async (data: GoalEntryRequest): Promise<GoalEntry> => {
  const response = await api.post('/goal-entries', data);
  return response.data;
};

export const updateGoalEntry = async (id: string, data: GoalEntryRequest): Promise<GoalEntry> => {
  const response = await api.put(`/goal-entries/${id}`, data);
  return response.data;
};

export const deleteGoalEntry = async (id: string): Promise<void> => {
  await api.delete(`/goal-entries/${id}`);
};
