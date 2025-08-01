import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskItem } from '../types/task';

export const readStorageTask = async (
  key: string,
  defaultValue: TaskItem[] = [],
) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('加载数据失败:', error);
    return defaultValue;
  }
};
