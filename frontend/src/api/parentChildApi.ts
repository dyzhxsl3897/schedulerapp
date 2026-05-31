import api from './axios';
import { ChildInfo } from '../types';

export const getChildren = async (): Promise<ChildInfo[]> => {
  const response = await api.get('/parent-children');
  return response.data;
};

export const addChild = async (username: string): Promise<ChildInfo> => {
  const response = await api.post('/parent-children', { username });
  return response.data;
};

export const removeChild = async (childId: string): Promise<void> => {
  await api.delete(`/parent-children/${childId}`);
};