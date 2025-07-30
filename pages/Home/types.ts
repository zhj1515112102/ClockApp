// types.ts
export interface SignInItem {
  id: string;
  name: string;
  createdAt: string;
}

export interface CompletedItem extends SignInItem {
  completedAt: string;
}

export type RootStackParamList = {
  Home: undefined;
  // 可以添加其他页面
};
