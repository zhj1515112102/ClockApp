import { TaskItem } from '../types/task';

export const filterUncompletedItems = (
  items: TaskItem[],
  completed: TaskItem[],
): TaskItem[] => {
  // 合并 baseItems 和 items（去重）
  const allItems = items.filter(
    (item, index, self) => index === self.findIndex(t => t.id === item.id),
  );

  // 筛选未完成的项（不在 completed 中）
  return allItems.filter(
    item => !completed.some(completedItem => completedItem.id === item.id),
  );
};
