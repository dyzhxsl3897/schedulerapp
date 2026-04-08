export interface User {
  id: string;
  username: string;
  roles: string[];
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export enum StrategyStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ACHIEVED = 'ACHIEVED',
  NOT_ACHIEVED = 'NOT_ACHIEVED',
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  academicYear: number;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalEntry {
  id: string;
  objectiveId: string;
  goal: string;
  strategy: string;
  measure: string;
  endDate: string;
  importance: number;
  result: string;
  status: StrategyStatus;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledEvent {
  id: string;
  activityId?: string;
  title: string;
  description?: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime?: string; // HH:mm:ss
  durationMinutes?: number;
  isCompleted: boolean;
  priority?: string;
  googleEventId?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pendingAction?: AssistantAction;
}

export type AssistantActionType = 'create_activity' | 'create_event';

export interface AssistantAction {
  type: AssistantActionType;
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  resultMessage?: string;
}
