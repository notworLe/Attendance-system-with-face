import { postUrlEncoded, get } from './api';

export async function login(email, password) {
  // fastapi-users expects form-encoded with field name "username"
  const data = await postUrlEncoded('/auth/jwt/login', { username: email, password });
  if (data?.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }
  return data;
}

export async function logout() {
  try {
    await postUrlEncoded('/auth/jwt/logout', {});
  } catch (_) { /* ignore */ }
  localStorage.removeItem('access_token');
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function isLoggedIn() {
  return !!getToken();
}

export async function getCurrentUser() {
  return get('/users/me');
}

export async function getTeachers() {
  return get('/teachers');
}
