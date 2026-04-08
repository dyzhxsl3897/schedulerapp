import api from './axios';
import { AssistantAction, AssistantActionType, ChatMessage } from '../types';

interface RawAction {
  type: AssistantActionType;
  payload: Record<string, unknown>;
}

interface ChatResponsePayload {
  reply: string;
  action?: RawAction | null;
}

export interface AssistantReply {
  reply: string;
  action?: AssistantAction;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<AssistantReply> {
  const payload = {
    message,
    history: history.map((m) => ({ role: m.role, content: m.content })),
  };
  const response = await api.post<ChatResponsePayload>('/ai/chat', payload);
  const { reply, action } = response.data;
  return {
    reply,
    action: action
      ? { type: action.type, payload: action.payload, status: 'pending' }
      : undefined,
  };
}
