'use client';
import { useState, useEffect, useRef } from 'react';
import AppShell from '../components/AppShell';
import { getHumans, createHuman, deleteHuman } from '../lib/humanApi';
import { getTasks, addHumanToTask, removeHumanFromTask, getTaskHumans } from '../lib/taskApi';

const COLORS = ['#143A51','#C49A68','#1a4a66','#1A8F6F','#0B1F3A','#8a5c1e','#1e5a7a','#9a6b2a'];
const avatarColor = (id) => COLORS[id % COLORS.length];

/* ── Add Human Modal ── */
function HumanModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!name.trim() || !photo) return;
    setLoading(true);
    setError('');
    try {
      await onSave(name.trim(), photo);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">➕ Thêm người mới</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Họ và tên *</label>
            <input className="form-input" placeholder="Nguyễn Văn A"
              value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
              📸 Ảnh khuôn mặt * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(1 ảnh, rõ mặt, nhìn thẳng)</span>
            </label>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: '2px dashed var(--border-bright)', borderRadius: 'var(--radius-md)',
                padding: preview ? 12 : 24, textAlign: 'center', cursor: 'pointer',
                background: 'var(--bg-surface)', transition: 'border-color 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
            >
              {preview ? (
                <>
                  <img src={preview} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>✅ Đã chọn ảnh</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{photo?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4 }}>Click để đổi ảnh</div>
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click để chọn ảnh</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG — Phải có đúng 1 khuôn mặt</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
            </div>
          </div>

          <div style={{
            background: 'rgba(20,58,81,0.06)', border: '1px solid rgba(20,58,81,0.15)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)',
          }}>
            💡 AI sẽ tự động trích xuất đặc trưng khuôn mặt từ ảnh. Chụp ảnh rõ nét, đủ ánh sáng, nhìn thẳng vào camera.
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || !photo || loading}>
            {loading ? <><span className="spinner" /> Đang xử lý AI…</> : '💾 Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [humans, setHumans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getHumans()
      .then(h => setHumans(h || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (name, imageFile) => {
    const newHuman = await createHuman(name, imageFile);
    setHumans(prev => [...prev, newHuman]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa người này khỏi hệ thống?')) return;
    await deleteHuman(id);
    setHumans(prev => prev.filter(h => h.id !== id));
  };

  const filtered = humans.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
      title="Quản lý Sinh viên"
      subtitle={`${humans.length} người đã đăng ký trong hệ thống`}
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Thêm người</button>
      }
    >
      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Tổng số người', value: humans.length, color: 'primary' },
          { label: 'Đã đăng ký khuôn mặt', value: humans.length, color: 'gold' },
          { label: 'Chưa đăng ký', value: 0, color: 'yellow' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.color}`}>{loading ? '…' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Tìm theo tên..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} kết quả</div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div>{search ? 'Không tìm thấy kết quả' : 'Chưa có ai. Thêm người đầu tiên!'}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Người</th>
                  <th>ID</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(h => (
                  <tr key={h.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: avatarColor(h.id), color: 'white' }}>
                          {h.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{h.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>#{h.id}</td>
                    <td><span className="badge badge-success">✓ Đã đăng ký khuôn mặt</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(h.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <HumanModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </AppShell>
  );
}
