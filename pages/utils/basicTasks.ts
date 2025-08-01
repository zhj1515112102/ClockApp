import RNFS from 'react-native-fs';
import uuid from 'react-native-uuid';
import { TaskItem } from '../types/task';
const uuidv4 = uuid.v4;

// 基础任务文件路径
const BASIC_TASKS_PATH = `${RNFS.DocumentDirectoryPath}/basicTasks.json`;

// 默认基础任务
const DEFAULT_BASIC_TASKS: TaskItem[] = [
  {
    id: `base_${uuidv4()}`,
    name: '跑步1公里',
    category: '运动',
    // checked: true,
  },
  {
    id: `base_${uuidv4()}`,
    name: '马步1分钟',
    category: '运动',
    // checked: true,
  },
];

// 初始化基础任务文件
export const initBasicTasksFile = async () => {
  try {
    const fileExists = await RNFS.exists(BASIC_TASKS_PATH);
    console.log('基础任务文件是否存在:', fileExists);
    if (!fileExists) {
      await RNFS.writeFile(
        BASIC_TASKS_PATH,
        JSON.stringify(DEFAULT_BASIC_TASKS),
        'utf8',
      );
      console.log('基础任务文件创建成功');
    }
  } catch (error) {
    console.error('初始化基础任务文件失败:', error);
    throw error; // 抛出错误让调用方处理
  }
};

// 读取基础任务
export const loadBasicTasks = async () => {
  try {
    await initBasicTasksFile(); // 确保文件存在

    const content = await RNFS.readFile(BASIC_TASKS_PATH, 'utf8');
    const tasks = JSON.parse(content);

    // 验证数据格式
    if (!Array.isArray(tasks)) {
      console.warn('基础任务数据格式错误，重置为默认值');
      await RNFS.writeFile(
        BASIC_TASKS_PATH,
        JSON.stringify(DEFAULT_BASIC_TASKS),
        'utf8',
      );
      return DEFAULT_BASIC_TASKS;
    }

    return tasks;
  } catch (error) {
    console.error('读取基础任务失败:', error);
    return DEFAULT_BASIC_TASKS; // 失败时返回默认值
  }
};

// 更新基础任务
export const saveBasicTasks = async (tasks: TaskItem[]) => {
  try {
    // 验证数据
    if (!Array.isArray(tasks)) {
      throw new Error('任务数据必须是数组');
    }

    await RNFS.writeFile(BASIC_TASKS_PATH, JSON.stringify(tasks), 'utf8');
    return true;
  } catch (error) {
    console.error('保存基础任务失败:', error);
    return false;
  }
};
