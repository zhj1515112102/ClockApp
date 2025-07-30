import { SignInItem } from './types';

export const mockData: SignInItem[] = [
  {
    id: '1',
    name: 'Sample Sign In Item',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Another Sign In Item',
    createdAt: new Date().toISOString(),
  },
];
