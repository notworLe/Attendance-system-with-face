const BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (res.status === 401) {
    // Token hết hạn hoặc chưa đăng nhập → xóa token và về login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/auth/login';
    }
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }
  if (!res.ok) {
    let error;
    try { error = await res.json(); } catch { error = { detail: res.statusText }; }
    throw new Error(error.detail || `Lỗi ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  return handleResponse(res);
}

export async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function postUrlEncoded(path, data) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...authHeaders() },
    body: new URLSearchParams(data).toString(),
  });
  return handleResponse(res);
}

export async function postForm(path, formData) {
  // No Content-Type header — browser sets it with boundary for multipart
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  return handleResponse(res);
}

export async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse(res);
}

export async function patch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function del(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  return handleResponse(res);
}

export function getWsUrl(path) {
  const base = (process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000')
    .replace(/^http/, 'ws');
  return `${base}${path}`;
}
