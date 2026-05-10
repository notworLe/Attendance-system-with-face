'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from './components/AppShell';
import { getTasks, createTask, deleteTask } from './lib/taskApi';
import { getHumans } from './lib/humanApi';
import { createSession } from './lib/sessionApi';
import { addHumanToTask, removeHumanFromTask, getTaskHumans } from './lib/taskApi';

const DAYS   = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKLY = [85, 78, 92, 88, 91, 76, 89]; // placeholder chart

function MiniBarChart({ data, days }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 72 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%', height: `${(v / max) * 56}px`,
            background: `linear-gradient(180deg, #143A51, #0B1F3A)`,
            borderRadius: '4px 4px 0 0', opacity: i === 4 ? 1 : 0.55,
            transition: 'opacity 0.2s',
          }} title={`${v}%`} />
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{days[i]}</div>
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task, onStart, onDelete, onManageHumans }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg, var(--primary), var(--primary-lt))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>🎓</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy-dark)', marginBottom: 2 }}>{task.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Tạo {new Date(task.created_at).toLocaleDateString('vi-VN')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onManageHumans(task)}>👤 Quản lý người</button>
        <button className="btn btn-primary btn-sm" onClick={() => onStart(task)}>▶ Bắt đầu</button>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(task.id)}>🗑️</button>
      </div>
    </div>
  );
}

function NewTaskModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onSave(name.trim());
    setLoading(false);
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div className="modal-title">➕ Tạo Task mới</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Tên Task / Lớp học</label>
          <input className="form-input" placeholder="VD: CNTT-K22A, Lập trình Web..."
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || loading}>
            {loading ? <span className="spinner" /> : '💾 Tạo'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskHumansModal({ task, allHumans, onClose }) {
  const [taskHumans, setTaskHumans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTaskHumans(task.id).then(data => {
      setTaskHumans((data.task_humans || []).map(th => th.human.id));
      setLoading(false);
    });
  }, [task.id]);

  const toggleHuman = async (humanId, isAdding) => {
    try {
      if (isAdding) {
        await addHumanToTask(task.id, humanId);
        setTaskHumans(prev => [...prev, humanId]);
      } else {
        await removeHumanFromTask(task.id, humanId);
        setTaskHumans(prev => prev.filter(id => id !== humanId));
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-title">👤 Lớp: {task.name}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '0 4px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>
          ) : allHumans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
              Chưa có sinh viên nào trong hệ thống. Vui lòng thêm sinh viên ở tab Sinh viên trước.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allHumans.map(h => {
                const inTask = taskHumans.includes(h.id);
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm" style={{ background: inTask ? 'var(--primary)' : 'var(--bg-hover)', color: inTask ? 'white' : 'var(--text-muted)' }}>
                        {h.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{h.id}</div>
                      </div>
                    </div>
                    <button className={`btn btn-sm ${inTask ? 'btn-danger' : 'btn-secondary'}`} onClick={() => toggleHuman(h.id, !inTask)}>
                      {inTask ? 'Xóa' : 'Thêm'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [humans, setHumans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [managingTask, setManagingTask] = useState(null); // task to manage humans
  const [starting, setStarting] = useState(null); // taskId being started
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('vi-VN'));
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([getTasks(), getHumans()])
      .then(([t, h]) => { setTasks(t || []); setHumans(h || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (name) => {
    const newTask = await createTask(name);
    setTasks(prev => [...prev, newTask]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa task này?')) return;
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleStart = async (task) => {
    setStarting(task.id);
    try {
      const session = await createSession(task.id);
      router.push(`/attendance?taskId=${task.id}&sessionId=${session.id}`);
    } catch (err) {
      alert(`Lỗi tạo phiên: ${err.message}`);
    } finally {
      setStarting(null);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Hôm nay, ${mounted ? new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}`}
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Tạo Task mới
        </button>
      }
    >
      {/* Stats */}
      <div className="stat-grid">
        {[
          { label: 'Tổng sinh viên', value: loading ? '…' : humans.length, color: 'primary', icon: '👥' },
          { label: 'Tasks đang hoạt động', value: loading ? '…' : tasks.length, color: 'gold', icon: '🎓' },
          { label: 'Thời gian hiện tại', value: time, color: 'green', icon: '🕐' },
          { label: 'Trạng thái AI', value: 'Online', color: 'green', icon: '🤖' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.color}`}>{s.value}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mt-24">
        {/* Chart placeholder */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Tỷ lệ điểm danh tuần này</div>
              <div className="card-subtitle">Xem báo cáo để biết thêm</div>
            </div>
            <Link href="/reports"><button className="btn btn-ghost btn-sm">Xem →</button></Link>
          </div>
          <MiniBarChart data={WEEKLY} days={DAYS} />
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Thao tác nhanh</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '👥', label: 'Quản lý sinh viên', desc: `${humans.length} người đã đăng ký`, href: '/students', color: 'var(--primary)' },
              { icon: '📊', label: 'Xem báo cáo', desc: 'Thống kê điểm danh', href: '/reports', color: 'var(--gold)' },
            ].map(a => (
              <Link key={a.href} href={a.href}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)', cursor: 'pointer',
                  transition: 'all 0.2s', border: '1px solid var(--border)',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks list */}
      <div className="card mt-24">
        <div className="card-header">
          <div className="card-title">📋 Danh sách Tasks</div>
          <span className="badge badge-primary">{tasks.length} tasks</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div>Chưa có task nào. Tạo task đầu tiên để bắt đầu điểm danh!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tasks.map(task => (
              <div key={task.id} style={{ opacity: starting === task.id ? 0.6 : 1 }}>
                <TaskCard task={task} onStart={handleStart} onDelete={handleDelete} onManageHumans={setManagingTask} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <NewTaskModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
      {managingTask && <TaskHumansModal task={managingTask} allHumans={humans} onClose={() => setManagingTask(null)} />}
    </AppShell>
  );
}
