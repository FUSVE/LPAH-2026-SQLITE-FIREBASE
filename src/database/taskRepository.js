import { getDatabase } from './database';

function now() {
  return new Date().toISOString();
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

async function addToSyncQueue(taskId, operation, payload) {
  const database = await getDatabase();

  await database.runAsync(
    `
    INSERT INTO sync_queue (task_id, operation, payload, created_at)
    VALUES (?, ?, ?, ?)
    `,
    [taskId, operation, JSON.stringify(payload), now()]
  );
}

export async function createTask(title) {
  const database = await getDatabase();

  const task = {
    id: generateId(),
    title,
    completed: 0,
    deleted: 0,
    created_at: now(),
    updated_at: now(),
    synced: 0,
  };

  await database.runAsync(
    `
    INSERT INTO tasks 
    (id, title, completed, deleted, created_at, updated_at, synced)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      task.id,
      task.title,
      task.completed,
      task.deleted,
      task.created_at,
      task.updated_at,
      task.synced,
    ]
  );

  await addToSyncQueue(task.id, 'CREATE', task);

  return task;
}

export async function listTasks() {
  const database = await getDatabase();

  return await database.getAllAsync(
    `
    SELECT * FROM tasks
    WHERE deleted = 0
    ORDER BY created_at DESC
    `
  );
}

export async function toggleTask(task) {
  const database = await getDatabase();

  const updatedTask = {
    ...task,
    completed: task.completed ? 0 : 1,
    updated_at: now(),
    synced: 0,
  };

  await database.runAsync(
    `
    UPDATE tasks
    SET completed = ?, updated_at = ?, synced = 0
    WHERE id = ?
    `,
    [updatedTask.completed, updatedTask.updated_at, task.id]
  );

  await addToSyncQueue(task.id, 'UPDATE', updatedTask);

  return updatedTask;
}

export async function deleteTask(task) {
  const database = await getDatabase();

  const updatedTask = {
    ...task,
    deleted: 1,
    updated_at: now(),
    synced: 0,
  };

  await database.runAsync(
    `
    UPDATE tasks
    SET deleted = 1, updated_at = ?, synced = 0
    WHERE id = ?
    `,
    [updatedTask.updated_at, task.id]
  );

  await addToSyncQueue(task.id, 'DELETE', updatedTask);
}

export async function getSyncQueue() {
  const database = await getDatabase();

  return await database.getAllAsync(
    `
    SELECT * FROM sync_queue
    ORDER BY created_at ASC
    `
  );
}

export async function removeFromSyncQueue(queueId) {
  const database = await getDatabase();

  await database.runAsync(
    `
    DELETE FROM sync_queue
    WHERE id = ?
    `,
    [queueId]
  );
}

export async function markTaskAsSynced(taskId) {
  const database = await getDatabase();

  await database.runAsync(
    `
    UPDATE tasks
    SET synced = 1
    WHERE id = ?
    `,
    [taskId]
  );
}

export async function upsertTaskFromRemote(task) {
  const database = await getDatabase();

  const localTask = await database.getFirstAsync(
    `
    SELECT * FROM tasks
    WHERE id = ?
    `,
    [task.id]
  );

  if (!localTask) {
    await database.runAsync(
      `
      INSERT INTO tasks
      (id, title, completed, deleted, created_at, updated_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [
        task.id,
        task.title,
        task.completed ? 1 : 0,
        task.deleted ? 1 : 0,
        task.created_at,
        task.updated_at,
      ]
    );

    return;
  }

  if (new Date(task.updated_at) > new Date(localTask.updated_at)) {
    await database.runAsync(
      `
      UPDATE tasks
      SET title = ?, completed = ?, deleted = ?, updated_at = ?, synced = 1
      WHERE id = ?
      `,
      [
        task.title,
        task.completed ? 1 : 0,
        task.deleted ? 1 : 0,
        task.updated_at,
        task.id,
      ]
    );
  }
}