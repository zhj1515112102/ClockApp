import { SignInItem } from './types';

export const filterUncompletedItems = (
  baseItems: SignInItem[],
  items: SignInItem[],
  completed: SignInItem[],
): SignInItem[] => {
  // 合并 baseItems 和 items（去重）
  const allItems = [...baseItems, ...items].filter(
    (item, index, self) => index === self.findIndex(t => t.id === item.id),
  );

  // 筛选未完成的项（不在 completed 中）
  return allItems.filter(
    item => !completed.some(completedItem => completedItem.id === item.id),
  );
};
