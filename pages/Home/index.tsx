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
import { CompletedItem, SignInItem } from './types';
import { mockData } from './mock';
import { cloneDeep } from 'lodash';
import AddTaskModal from './AddTaskModal';
import uuid from 'react-native-uuid';
import { filterUncompletedItems } from './utils';

const STORAGE_KEYS = {
  BASE_ITEMS: 'baseItems',
  SIGN_IN_ITEMS: 'signInItems',
  COMPLETED_ITEMS: 'completedItems',
} as const;

const uuidv4 = uuid.v4;

const { height: screenHeight } = Dimensions.get('window');

const Home: React.FC<any> = props => {
  const [signInItems, setSignInItems] = useState<SignInItem[]>([]);
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // 加载本地存储的数据
  useEffect(() => {
    // AsyncStorage.setItem(STORAGE_KEYS.SIGN_IN_ITEMS, JSON.stringify(mockData));
    loadData();
  }, []);

  const readStorage = async (key: string, defaultValue: SignInItem[] = []) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('加载数据失败:', error);
      return defaultValue;
    }
  };

  const loadData = async () => {
    const [baseItems, items, completed] = await Promise.all([
      readStorage(STORAGE_KEYS.BASE_ITEMS),
      readStorage(STORAGE_KEYS.SIGN_IN_ITEMS),
      readStorage(STORAGE_KEYS.COMPLETED_ITEMS),
    ]);
    console.log('加载数据:', baseItems, items, completed);
    setSignInItems(filterUncompletedItems(baseItems, items, completed));
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

  const addSignInItem = (taskName: string): void => {
    const newItem: SignInItem = {
      id: uuidv4(),
      name: taskName.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [...signInItems, newItem];
    setSignInItems(updatedItems);
    saveData(STORAGE_KEYS.SIGN_IN_ITEMS, updatedItems);
    setModalVisible(false);
  };

  const completeSignInItem = (item: SignInItem): void => {
    const newCompletedItem: CompletedItem = {
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

  const renderSignInItem = ({ item }: { item: SignInItem }) => (
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

  const renderCompletedItem = ({ item }: { item: CompletedItem }) => (
    <View style={[styles.itemContainer, styles.completedItem]}>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.completedTime}>
        {new Date(item.completedAt).toLocaleString()}
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
