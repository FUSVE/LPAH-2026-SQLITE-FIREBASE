import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';

export function TaskItem({ task, onToggle, onDelete }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onToggle(task)} style={styles.titleArea}>
        <Text style={[styles.title, task.completed && styles.completed]}>
          {task.completed ? '- ' : 'o'}
          {task.title}
        </Text>

        <Text style={styles.syncStatus}>
          {task.synced ? 'Sincronizada' : 'Pendente'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onDelete(task)}>
        <Text style={styles.delete}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#222',
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#777',
  },
  syncStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  delete: {
    color: '#c0392b',
    fontWeight: 'bold',
    marginLeft: 12,
  },
});