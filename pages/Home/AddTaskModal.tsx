import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';

interface AddTaskModalProps {
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  clickAdd: (taskName: string, category: string) => void;
}

const AddTaskModal = (props: AddTaskModalProps) => {
  const { clickAdd, setModalVisible } = props;
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState(''); // 新增分类状态

  const addTask = () => {
    if (!taskName.trim()) {
      return; // 如果输入为空则不添加
    }
    clickAdd(taskName, category);
    setTaskName('');
    Keyboard.dismiss(); // 关闭键盘
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>添加新任务</Text>

        {/* 任务名称输入框 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="输入任务名称"
            value={taskName}
            onChangeText={setTaskName}
            autoFocus={true}
            // onSubmitEditing={addTask} // 键盘回车提交
            returnKeyType="done"
          />
          <TextInput
            style={styles.input}
            placeholder="输入任务类别"
            value={category}
            onChangeText={setCategory}
            autoFocus={false}
            // onSubmitEditing={addTask} // 键盘回车提交
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={addTask}
            disabled={!taskName.trim()}
          >
            <Text
              style={[
                styles.submitButtonText,
                !taskName.trim() && styles.disabledButton,
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
  );
};

const styles = StyleSheet.create({
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
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
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
    color: 'white',
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

export default AddTaskModal;
