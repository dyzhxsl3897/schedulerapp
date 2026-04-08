import api from './axios';
import { AssistantAction } from '../types';

/**
 * Event dispatched on `window` after an assistant action successfully mutates
 * server state, so pages like DashboardPage can refresh their local data
 * without being directly coupled to the chat component.
 */
export const ASSISTANT_DATA_CHANGED_EVENT = 'scheduler:assistant-data-changed';

export interface ExecuteResult {
  message: string;
}

export async function executeAssistantAction(
  action: AssistantAction
): Promise<ExecuteResult> {
  switch (action.type) {
    case 'create_activity': {
      const { title, description, priority } = action.payload as {
        title: string;
        description?: string;
        priority?: string;
      };
      await api.post('/activities', { title, description, priority });
      window.dispatchEvent(
        new CustomEvent(ASSISTANT_DATA_CHANGED_EVENT, { detail: { type: action.type } })
      );
      return { message: `Created activity "${title}".` };
    }
    case 'create_event': {
      const {
        title,
        description,
        activityId,
        date,
        startTime,
        durationMinutes,
      } = action.payload as {
        title: string;
        description?: string;
        activityId?: string;
        date: string;
        startTime?: string;
        durationMinutes?: number;
      };
      // Backend expects HH:mm:ss
      const startTimeFormatted =
        startTime && startTime.length === 5 ? `${startTime}:00` : startTime;
      await api.post('/events', {
        title,
        description,
        activityId,
        date,
        startTime: startTimeFormatted,
        durationMinutes,
      });
      window.dispatchEvent(
        new CustomEvent(ASSISTANT_DATA_CHANGED_EVENT, { detail: { type: action.type } })
      );
      return {
        message: `Scheduled "${title}" on ${date}${startTime ? ` at ${startTime}` : ''}.`,
      };
    }
    default: {
      const _exhaustive: never = action.type;
      throw new Error(`Unsupported action type: ${_exhaustive}`);
    }
  }
}
