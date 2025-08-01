export interface TaskItem {
  id: string;
  name: string;
  category: string;
  // checked: boolean;
  createdAt?: string;
  completedAt?: string;
}
