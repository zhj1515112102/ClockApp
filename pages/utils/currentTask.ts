import RNFS from 'react-native-fs';
import uuid from 'react-native-uuid';
import { TaskItem } from '../types/task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { LAST_DATE_KEY, STORAGE_KEYS } from './constants';
import { readStorageTask } from '.';
import { loadBasicTasks } from './basicTasks';
const uuidv4 = uuid.v4;

// 在应用启动时检查日期变化
export const checkDateChange = async () => {
  const today = dayjs().format('YYYY-MM-DD');
  const lastSavedDate = await AsyncStorage.getItem(LAST_DATE_KEY);

  if (lastSavedDate !== today) {
    await AsyncStorage.setItem(LAST_DATE_KEY, today);
    return true; // 是新的一天
  }
  return false;
};

export const initCurrentTaskData = async () => {
  const isNewDay = await checkDateChange();
  const lastDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  if (isNewDay) {
    // 1. 获取前一天的数据存入当月文件内
    const [items, completed] = await Promise.all([
      readStorageTask(STORAGE_KEYS.SIGN_IN_ITEMS),
      readStorageTask(STORAGE_KEYS.COMPLETED_ITEMS),
    ]);
    const lastData = {
      lastDate: {
        [STORAGE_KEYS.SIGN_IN_ITEMS]: items,
        [STORAGE_KEYS.COMPLETED_ITEMS]: completed,
      },
    };
    // 2. 初始化当天任务（基础任务放到待办列表，清空已办列表）
    const basicTasks = await loadBasicTasks();
    console.log('xxxxxxxxxxxx 基础任务:', basicTasks);
  }
};
