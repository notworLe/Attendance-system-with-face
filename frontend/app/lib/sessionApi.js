import { post, put, patch, get, getWsUrl } from './api';

const BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

export const createSession = (taskId, threshold = 0.5) =>
  post(`/task/${taskId}/session`, { threshold });

export const closeSession = (sessionId) =>
  put(`/session/${sessionId}/close`);

export const getTaskSessions = (taskId) =>
  get(`/task/${taskId}/sessions`);

export const getSessionReport = (sessionId) =>
  get(`/session/${sessionId}/report`);

export const getTaskReport = (taskId) =>
  get(`/task/${taskId}/report`);

/**
 * POST /session/{id}/recognize — no auth required (IoT-friendly)
 * imageBlob: Blob captured from webcam canvas
 */
export async function recognizeFaces(sessionId, imageBlob) {
  const fd = new FormData();
  fd.append('image', imageBlob, 'frame.jpg');
  const res = await fetch(`${BASE_URL}/session/${sessionId}/recognize?draw_box=false&crop_faces=false`, {
    method: 'POST',
    body: fd,
    // No auth header needed for this endpoint
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Lỗi nhận diện');
  }
  return res.json();
}

/**
 * Create WebSocket connection to receive realtime events
 * Events: { event: "human_recognized", human_id, name, confidence }
 *         { event: "unrecognized_face_detected" }
 */
export function connectSessionWs(sessionId, onMessage) {
  const ws = new WebSocket(`${(BASE_URL).replace(/^http/, 'ws')}/ws/session/${sessionId}`);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch (_) {}
  };
  ws.onerror = (e) => console.warn('WS error', e);
  return ws;
}
