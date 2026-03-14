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
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledEvent {
  id: string;
  activityId?: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime?: string; // HH:mm:ss
  durationMinutes?: number;
  isCompleted: boolean;
  userId: string;
}
