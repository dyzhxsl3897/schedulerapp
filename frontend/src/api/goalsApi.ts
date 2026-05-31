import api from './axios';
import { Objective, GoalEntry, StrategyStatus } from '../types';

// --- Objective ---

export interface ObjectiveRequest {
  title: string;
  description?: string;
  academicYear: number;
  sortOrder?: number;
}

export const getObjectives = async (academicYear: number, forUserId?: string | null): Promise<Objective[]> => {
  const params: Record<string, any> = { academicYear };
  if (forUserId) params.forUserId = forUserId;
  const response = await api.get('/objectives', { params });
  return response.data;
};

export const createObjective = async (data: ObjectiveRequest, forUserId?: string | null): Promise<Objective> => {
  const params: Record<string, any> = {};
  if (forUserId) params.forUserId = forUserId;
  const response = await api.post('/objectives', data, { params });
  return response.data;
};

export const updateObjective = async (id: string, data: ObjectiveRequest, forUserId?: string | null): Promise<Objective> => {
  const params: Record<string, any> = {};
  if (forUserId) params.forUserId = forUserId;
  const response = await api.put(`/objectives/${id}`, data, { params });
  return response.data;
};

export const deleteObjective = async (id: string, forUserId?: string | null): Promise<void> => {
  const params: Record<string, any> = {};
  if (forUserId) params.forUserId = forUserId;
  await api.delete(`/objectives/${id}`, { params });
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

export const getGoalEntries = async (objectiveIds: string[], forUserId?: string | null): Promise<GoalEntry[]> => {
  if (objectiveIds.length === 0) return [];
  const params: Record<string, any> = { objectiveIds: objectiveIds.join(',') };
  if (forUserId) params.forUserId = forUserId;
  const response = await api.get('/goal-entries', { params });
  return response.data;
};

export const createGoalEntry = async (data: GoalEntryRequest, forUserId?: string | null): Promise<GoalEntry> => {
  const params: Record<string, any> = {};
  if (forUserId) params.forUserId = forUserId;
  const response = await api.post('/goal-entries', data, { params });
  return response.data;
};

export const updateGoalEntry = async (id: string, data: GoalEntryRequest, forUserId?: string | null): Promise<GoalEntry> => {
  const params: Record<string, any> = {};
  if (forUserId) params.forUserId = forUserId;
  const response = await api.put(`/goal-entries/${id}`, data, { params });
  return response.data;
};

export const deleteGoalEntry = async (id: string, forUserId?: string | null): Promise<void> => {
  const params: Record<string, any> = {};
  if (forUserId) params.forUserId = forUserId;
  await api.delete(`/goal-entries/${id}`, { params });
};