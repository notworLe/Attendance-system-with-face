import { get, post, put, del } from './api';

export const getTasks = () => get('/task');
export const getTask  = (id) => get(`/task/${id}`);
export const createTask = (data) => post('/task', data);
export const updateTask = (id, data) => put(`/task/${id}`, data);
export const deleteTask = (id) => del(`/task/${id}`);

// Returns TaskDisplay: { id, name, task_humans: [{ human: { id, name } }] }
export const getTaskHumans = (taskId) => get(`/task/${taskId}/humans`);

export const addHumanToTask    = (taskId, humanId) => post(`/task/${taskId}/humans?human_id=${humanId}`, {});
export const removeHumanFromTask = (taskId, humanId) => del(`/task/${taskId}/humans/${humanId}`);
