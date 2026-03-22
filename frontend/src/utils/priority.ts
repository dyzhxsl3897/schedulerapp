export interface PriorityColors {
  backgroundColor: string;
  borderColor: string;
}

export function getPriorityColors(priority?: string): PriorityColors {
  switch (priority) {
    case 'HIGH':
      return { backgroundColor: '#fce4ec', borderColor: '#e53935' };
    case 'MEDIUM':
      return { backgroundColor: '#fff3e0', borderColor: '#ff9800' };
    case 'LOW':
      return { backgroundColor: '#e8f5e9', borderColor: '#4caf50' };
    default:
      return { backgroundColor: '#e3f2fd', borderColor: '#2196f3' };
  }
}
