import NetInfo from '@react-native-community/netinfo';

import { db, ref, set, get, child } from './firebaseConfig';

import {
  getSyncQueue,
  removeFromSyncQueue,
  markTaskAsSynced,
  upsertTaskFromRemote,
} from '../database/taskRepository';

const USER_ID = 'usuario_teste';

export async function syncTasks() {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected) {
    return;
  }

  await sendLocalToFirebase();
  await getFirebaseToLocal();
}

async function sendLocalToFirebase() {
  const queue = await getSyncQueue();

  for (const item of queue) {
    const task = JSON.parse(item.payload);

    await set(
      ref(db, `users/${USER_ID}/tasks/${task.id}`),
      {
        ...task,
        completed: Boolean(task.completed),
        deleted: Boolean(task.deleted),
      }
    );

    await markTaskAsSynced(task.id);
    await removeFromSyncQueue(item.id);
  }
}

async function getFirebaseToLocal() {
  const snapshot = await get(
    child(ref(db), `users/${USER_ID}/tasks`)
  );

  if (!snapshot.exists()) return;

  const data = snapshot.val();

  for (const key in data) {
    await upsertTaskFromRemote(data[key]);
  }
}