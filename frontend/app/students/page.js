'use client';
import { useState, useRef } from 'react';
import AppShell from '../components/AppShell';

const MOCK_STUDENTS = [
  { id: 'SV001', name: 'Nguyễn Văn An',    class: 'CNTT-K22A', avatar: 'NA', faces: 4, rate: 91 },
  { id: 'SV002', name: 'Trần Thị Bình',    class: 'CNTT-K22A', avatar: 'TB', faces: 5, rate: 78 },
  { id: 'SV003', name: 'Lê Hoàng Cường',   class: 'CNTT-K22A', avatar: 'LC', faces: 3, rate: 95 },
  { id: 'SV004', name: 'Phạm Thị Dung',    class: 'CNTT-K22A', avatar: 'PD', faces: 0, rate: 65 },
  { id: 'SV005', name: 'Vũ Minh Đức',      class: 'CNTT-K22B', avatar: 'VĐ', faces: 5, rate: 88 },
  { id: 'SV006', name: 'Hoàng Thị Giang',  class: 'CNTT-K22B', avatar: 'HG', faces: 4, rate: 100 },
  { id: 'SV007', name: 'Đặng Văn Hải',     class: 'CNTT-K22B', avatar: 'ĐH', faces: 2, rate: 72 },
  { id: 'SV008', name: 'Bùi Thị Hoa',      class: 'CNTT-K23A', avatar: 'BH', faces: 5, rate: 96 },
];

const COLORS = ['#143A51','#C49A68','#1a4a66','#1A8F6F','#0B1F3A','#8a5c1e','#1e5a7a','#9a6b2a'];
const avatarColor = (id) => COLORS[parseInt(id.replace('SV','')) % COLORS.length];

/* ── Add Student Modal ── */
function StudentModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', id: '', class: 'CNTT-K22A', photos: [] });
  const fileRef = useRef();

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setForm(f => ({ ...f, photos: files }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">➕ Thêm sinh viên mới</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Mã sinh viên *</label>
              <input className="form-input" placeholder="VD: SV009" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Lớp *</label>
              <select className="form-input form-select" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
                <option>CNTT-K22A</option><option>CNTT-K22B</option><option>CNTT-K23A</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Họ và tên *</label>
            <input className="form-input" placeholder="Nguyễn Văn X" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          {/* Face registration */}
          <div>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
              📸 Đăng ký khuôn mặt (tối đa 5 ảnh)
            </label>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: '2px dashed var(--border-bright)', borderRadius: 'var(--radius-md)',
                padding: 24, textAlign: 'center', cursor: 'pointer',
                background: 'var(--bg-surface)',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
            >
              {form.photos.length > 0 ? (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                  <div style={{ fontSize: 13, color: 'var(--accent)' }}>{form.photos.length} ảnh đã chọn</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {form.photos.map(f => f.name).join(', ')}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Kéo thả hoặc click để chọn ảnh</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Chụp từ nhiều góc độ khác nhau — tối thiểu 3 ảnh</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotos} />
            </div>
            {form.photos.length > 0 && form.photos.length < 3 && (
              <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 6 }}>
                ⚠️ Khuyến nghị ít nhất 3 ảnh để tăng độ chính xác
              </div>
            )}
          </div>

          <div style={{
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)',
          }}>
            💡 Chụp ảnh: nhìn thẳng, nhìn nghiêng trái/phải, có và không đeo kính để đạt kết quả tốt nhất.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }}
            disabled={!form.name || !form.id}>
            💾 Lưu sinh viên
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || s.class === filterClass;
    return matchSearch && matchClass;
  });

  const handleSave = (form) => {
    const initials = form.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
    setStudents(prev => [...prev, {
      id: form.id || `SV${String(prev.length + 1).padStart(3, '0')}`,
      name: form.name, class: form.class, avatar: initials,
      faces: form.photos.length, rate: 0,
    }]);
  };

  const deleteStudent = (id) => setStudents(prev => prev.filter(s => s.id !== id));

  return (
    <AppShell
      title="Quản lý Sinh viên"
      subtitle={`${students.length} sinh viên trong hệ thống`}
      actions={
        <>
          <button className="btn btn-secondary">📥 Import Excel</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Thêm sinh viên</button>
        </>
      }
    >
      {/* ── Stats row ── */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Tổng sinh viên', value: students.length, color: 'primary' },
          { label: 'Đã đăng ký khuôn mặt', value: students.filter(s => s.faces > 0).length, color: 'gold' },
          { label: 'Chưa đăng ký', value: students.filter(s => s.faces === 0).length, color: 'yellow' },
          { label: 'Tỷ lệ điểm danh TB', value: `${Math.round(students.reduce((a, s) => a + s.rate, 0) / students.length)}%`, color: 'green' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 240 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Tìm theo tên, mã sinh viên..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input form-select" style={{ width: 160 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="all">Tất cả lớp</option>
          <option>CNTT-K22A</option><option>CNTT-K22B</option><option>CNTT-K23A</option>
        </select>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} kết quả</div>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Mã SV</th>
                <th>Lớp</th>
                <th>Ảnh khuôn mặt</th>
                <th>Tỷ lệ điểm danh</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm" style={{ background: avatarColor(s.id), color: 'white' }}>{s.avatar}</div>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 12 }}>{s.id}</td>
                  <td><span className="badge badge-primary">{s.class}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} style={{
                            width: 14, height: 14, borderRadius: 3,
                            background: i < s.faces ? 'var(--accent)' : 'var(--bg-hover)',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.faces}/5</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-wrap" style={{ width: 60, height: 6 }}>
                        <div className="progress-bar" style={{
                          width: `${s.rate}%`, height: 6,
                          background: s.rate >= 80 ? 'var(--success)' : s.rate >= 60 ? 'var(--warning)' : 'var(--danger)',
                        }} />
                      </div>
                      <span style={{ fontSize: 12 }}>{s.rate}%</span>
                    </div>
                  </td>
                  <td>
                    {s.faces === 0
                      ? <span className="badge badge-warning">⚠️ Chưa đăng ký</span>
                      : s.faces < 3
                        ? <span className="badge badge-muted">Ít ảnh</span>
                        : <span className="badge badge-success">✓ Hoạt động</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelected(s)}>Sửa</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteStudent(s.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <StudentModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </AppShell>
  );
}
