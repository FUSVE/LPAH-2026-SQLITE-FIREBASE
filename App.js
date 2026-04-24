import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { initDatabase } from './src/database/database';
import {
  createTask,
  listTasks,
  toggleTask,
  deleteTask,
} from './src/database/taskRepository';
import { syncTasks } from './src/services/syncService';
import { TaskItem } from './src/components/TaskItem';

export default function App() {
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function loadTasks() {
    const data = await listTasks();
    setTasks(data);
  }

  async function handleCreateTask() {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Digite uma tarefa.');
      return;
    }

    await createTask(title.trim());
    setTitle('');
    await loadTasks();

    await handleSync();
  }

  async function handleToggleTask(task) {
    await toggleTask(task);
    await loadTasks();

    await handleSync();
  }

  async function handleDeleteTask(task) {
    await deleteTask(task);
    await loadTasks();

    await handleSync();
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await syncTasks();
      await loadTasks();
    } catch (error) {
      console.log('Erro ao sincronizar:', error);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    async function start() {
      await initDatabase();
      await loadTasks();
      await handleSync();
    }

    start();

    const unsubscribe = NetInfo.addEventListener(async state => {
      const online = Boolean(state.isConnected);
      setIsOnline(online);

      if (online) {
        await handleSync();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>ToDo Sqlite/Firebase</Text>

        <Text style={styles.status}>
          Status: {isOnline ? 'Online' : 'Offline'}
        </Text>

        <Text style={styles.status}>
          Sincronização: {syncing ? 'Sincronizando...' : 'Parada'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Digite uma tarefa"
            value={title}
            onChangeText={setTitle}
          />

          <TouchableOpacity style={styles.button} onPress={handleCreateTask}>
            <Text style={styles.buttonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncButtonText}>Sincronizar agora</Text>
        </TouchableOpacity>

        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma tarefa cadastrada.</Text>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  form: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  button: {
    marginLeft: 8,
    backgroundColor: '#2e86de',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#777',
    marginTop: 40,
  },
});