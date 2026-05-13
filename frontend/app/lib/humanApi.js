import { get, del, postForm } from './api';

export const getHumans = () => get('/human/');
export const getHuman  = (id) => get(`/human/${id}`);
export const deleteHuman = (id) => del(`/human/${id}`);

/**
 * POST /human/ expects multipart/form-data:
 *   human: string (name, NOT JSON object)
 *   image: File (single face photo)
 */
export async function createHuman(name, imageFile) {
  const fd = new FormData();
  fd.append('human', name);      // string field
  fd.append('image', imageFile); // file field
  return postForm('/human/', fd);
}

export async function updateHuman(id, name, imageFile) {
  const fd = new FormData();
  if (name)      fd.append('name', name);
  if (imageFile) fd.append('image', imageFile);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000'}/human/${id}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
      body: fd,
    }
  );
  if (!res.ok) throw new Error((await res.json()).detail || 'Lỗi cập nhật');
  return res.json();
}
