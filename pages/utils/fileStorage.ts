import RNFS from 'react-native-fs';

// 获取存储目录路径
const getStorageDir = () => {
  return `${RNFS.DocumentDirectoryPath}/task_records`;
};

// 确保存储目录存在
const ensureStorageDir = async () => {
  const dir = getStorageDir();
  try {
    await RNFS.mkdir(dir);
  } catch (e: any) {
    if (e.code !== 'EEXIST') throw e;
  }
  return dir;
};

// 获取月份文件路径
const getMonthFilePath = (year: string, month: string) => {
  const monthStr = String(month).padStart(2, '0');
  return `${getStorageDir()}/${year}-${monthStr}.json`;
};
