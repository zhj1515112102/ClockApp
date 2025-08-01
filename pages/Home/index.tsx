import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Button,
  Dimensions,
  Modal,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { mockData } from './mock';
import { cloneDeep } from 'lodash';
import AddTaskModal from './AddTaskModal';
import uuid from 'react-native-uuid';
import { filterUncompletedItems } from './utils';
import RNFS from 'react-native-fs';
import { loadBasicTasks } from '../utils/basicTasks';
import { TaskItem } from '../types/task';
import { readStorageTask } from '../utils';
import { STORAGE_KEYS } from '../utils/constants';

const uuidv4 = uuid.v4;

const { height: screenHeight } = Dimensions.get('window');

const Home: React.FC<any> = props => {
  const [signInItems, setSignInItems] = useState<TaskItem[]>([]);
  const [completedItems, setCompletedItems] = useState<TaskItem[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // 加载本地存储的数据
  useEffect(() => {
    // AsyncStorage.setItem(STORAGE_KEYS.SIGN_IN_ITEMS, JSON.stringify(mockData));
    console.log(
      'xxxxxx DocumentDirectoryPath',
      `${RNFS.DocumentDirectoryPath}/task_records`,
    );
    loadData();
  }, []);

  const loadData = async () => {
    const [items, completed] = await Promise.all([
      readStorageTask(STORAGE_KEYS.SIGN_IN_ITEMS),
      readStorageTask(STORAGE_KEYS.COMPLETED_ITEMS),
    ]);

    console.log('加载数据:', items, completed);
    setSignInItems(filterUncompletedItems(items, completed));
    setCompletedItems(completed);
  };

  const saveData = async <T,>(key: string, data: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('保存数据失败:', error);
      Alert.alert('错误', '保存数据失败');
    }
  };

  const addSignInItem = (taskName: string, category: string): void => {
    const newItem: TaskItem = {
      id: uuidv4(),
      name: taskName.trim(),
      category: category || '默认分类',
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [...signInItems, newItem];
    setSignInItems(updatedItems);
    saveData(STORAGE_KEYS.SIGN_IN_ITEMS, updatedItems);
    setModalVisible(false);
  };

  const completeSignInItem = (item: TaskItem): void => {
    const newCompletedItem: TaskItem = {
      ...item,
      completedAt: new Date().toISOString(),
    };

    const updatedCompletedItems = [...completedItems, newCompletedItem];
    setCompletedItems(updatedCompletedItems);
    saveData(STORAGE_KEYS.COMPLETED_ITEMS, updatedCompletedItems);

    // 从签到项中移除
    const updatedSignInItems = signInItems.filter(i => i.id !== item.id);
    setSignInItems(updatedSignInItems);
    saveData(STORAGE_KEYS.SIGN_IN_ITEMS, updatedSignInItems);
  };

  const deleteItem = (itemId: string, isCompleted: boolean) => {
    Alert.alert(
      isCompleted ? '取消完成' : '删除任务', // 标题
      isCompleted ? '您确定要取消完成任务吗？' : '您确定要删除任务吗？', // 内容
      [
        {
          text: '取消',
          onPress: () => console.log('取消操作'),
          style: 'cancel',
        },
        {
          text: '确认',
          onPress: async () => {
            console.log('确认操作');
            try {
              if (isCompleted) {
                const updatedItems = completedItems.filter(
                  i => i.id !== itemId,
                );
                const newSingInItems = [
                  ...signInItems,
                  ...completedItems.filter(i => i.id == itemId),
                ];
                setCompletedItems(updatedItems);
                setSignInItems(newSingInItems);
                await saveData(STORAGE_KEYS.SIGN_IN_ITEMS, newSingInItems);
                await saveData(STORAGE_KEYS.COMPLETED_ITEMS, updatedItems);
              } else {
                const updatedItems = signInItems.filter(i => i.id !== itemId);
                setSignInItems(updatedItems);
                await saveData(STORAGE_KEYS.SIGN_IN_ITEMS, updatedItems);
              }
            } catch (error) {
              console.error('删除项目失败:', error);
              Alert.alert('错误', '删除项目失败');
            }
          },
        },
      ],
      { cancelable: false }, // 点击外部不关闭
    );
  };

  const renderSignInItem = ({ item }: { item: TaskItem }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.name}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => completeSignInItem(item)}>
          <Icon name="check-circle" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteItem(item.id, false)}>
          <Icon
            name="trash"
            size={24}
            color="#F44336"
            style={styles.deleteIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompletedItem = ({ item }: { item: TaskItem }) => (
    <View style={[styles.itemContainer, styles.completedItem]}>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.completedTime}>
        {new Date(item.completedAt || '').toLocaleString()}
      </Text>
      <TouchableOpacity onPress={() => deleteItem(item.id, true)}>
        <Icon name="times-circle" size={24} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>我的任务</Text>
      {/* 待完成 */}
      <View style={styles.signInTitle}>
        <Text style={styles.sectionTitle}>待完成 ({signInItems.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ 添加任务</Text>
        </TouchableOpacity>
      </View>
      <View style={{ maxHeight: screenHeight * 0.5 }}>
        <FlatList
          data={signInItems}
          renderItem={renderSignInItem}
          keyExtractor={item => item.id}
          style={{ flexGrow: 0 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>暂无待完成项</Text>
          }
        />
      </View>
      {/* 已完成 */}
      <Text style={styles.sectionTitle}>已完成 ({completedItems.length})</Text>
      <View style={{ maxHeight: screenHeight * 0.5 }}>
        <FlatList
          data={completedItems}
          renderItem={renderCompletedItem}
          keyExtractor={item => item.id}
          style={{ flexGrow: 0 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>暂无已完成项</Text>
          }
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          Keyboard.dismiss();
        }}
      >
        <AddTaskModal
          setModalVisible={setModalVisible}
          clickAdd={addSignInItem}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    paddingLeft: 10,
    backgroundColor: '#FFF',
  },
  addButton: {
    backgroundColor: 'white',
    // borderWidth: 1,
    // borderColor: '#2196F3',
    borderRadius: 5,
    padding: 12,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    // color: 'white',
    // fontSize: 16,
    fontWeight: 'bold',
  },
  signInTitle: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#555',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    elevation: 2,
  },
  completedItem: {
    backgroundColor: '#E8F5E9',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteIcon: {
    marginLeft: 15,
  },
  completedTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
});

export default Home;
