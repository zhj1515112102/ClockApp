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

const STORAGE_KEYS = {
  SIGN_IN_ITEMS: 'signInItems',
  COMPLETED_ITEMS: 'completedItems',
} as const;

const { height: screenHeight } = Dimensions.get('window');

const Home: React.FC<any> = props => {
  const [signInItems, setSignInItems] = useState<SignInItem[]>([]);
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [newItemName, setNewItemName] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // 加载本地存储的数据
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.SIGN_IN_ITEMS, JSON.stringify(mockData));
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [items, completed] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SIGN_IN_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_ITEMS),
      ]);
      console.log('加载数据:', items, completed);

      if (items) setSignInItems(JSON.parse(items));
      if (completed) setCompletedItems(JSON.parse(completed));
    } catch (error) {
      console.error('加载数据失败:', error);
      Alert.alert('错误', '加载数据失败');
    }
  };

  const saveData = async <T,>(key: string, data: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('保存数据失败:', error);
      Alert.alert('错误', '保存数据失败');
    }
  };

  const addSignInItem = (): void => {
    if (!newItemName.trim()) {
      Alert.alert('提示', '请输入签到项名称');
      return;
    }

    const newItem: SignInItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [...signInItems, newItem];
    setSignInItems(updatedItems);
    saveData(STORAGE_KEYS.SIGN_IN_ITEMS, updatedItems);
    setNewItemName('');
  };

  const completeSignInItem = (item: SignInItem): void => {
    Alert.alert(
      '完成任务', // 标题
      '您确定要完成此任务吗？', // 内容
      [
        {
          text: '取消',
          onPress: () => console.log('取消操作'),
          style: 'cancel',
        },
        {
          text: '确认',
          onPress: () => {
            console.log('确认操作');
            const newCompletedItem: CompletedItem = {
              ...item,
              completedAt: new Date().toISOString(),
            };

            const updatedCompletedItems = [...completedItems, newCompletedItem];
            setCompletedItems(updatedCompletedItems);
            saveData(STORAGE_KEYS.COMPLETED_ITEMS, updatedCompletedItems);

            // 从签到项中移除
            const updatedSignInItems = signInItems.filter(
              i => i.id !== item.id,
            );
            setSignInItems(updatedSignInItems);
            saveData(STORAGE_KEYS.SIGN_IN_ITEMS, updatedSignInItems);
          },
        },
      ],
      { cancelable: false }, // 点击外部不关闭
    );
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
      {/* <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="输入新的签到项"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TouchableOpacity style={styles.addButton} onPress={addSignInItem}>
          <Icon name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View> */}
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
      <Text style={styles.sectionTitle}>已完成 ({completedItems.length})</Text>
      <FlatList
        data={completedItems}
        renderItem={renderCompletedItem}
        keyExtractor={item => item.id}
        style={{ height: 'auto' }}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无已完成项</Text>}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          Keyboard.dismiss();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加新任务</Text>

            {/* 任务名称输入框 */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="输入任务名称"
                // value={taskName}
                // onChangeText={setTaskName}
                autoFocus={true}
                // onSubmitEditing={addTask} // 键盘回车提交
                returnKeyType="done"
              />
              <TouchableOpacity
              // style={styles.submitButton}
              // onPress={addTask}
              // disabled={!taskName.trim()}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    // !taskName.trim() && styles.disabledButton,
                  ]}
                >
                  添加
                </Text>
              </TouchableOpacity>
            </View>

            {/* 取消按钮 */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  submitButtonText: {
    // color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButton: {
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F44336',
  },
});

export default Home;
