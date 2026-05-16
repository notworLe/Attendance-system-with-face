'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from './components/AppShell';
import { getTasks, createTask, deleteTask } from './lib/taskApi';
import { getHumans } from './lib/humanApi';
import { createSession, getTaskSessions, updateSessionStatus } from './lib/sessionApi';
import { addHumanToTask, removeHumanFromTask, getTaskHumans } from './lib/taskApi';
import { useAuth } from './lib/AuthContext';
import TaskManagementModal from './components/TaskManagementModal';

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

function TaskCard({ task, onStart, onDelete, onManageHumans, role }) {
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
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy-dark)' }}>{task.name}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {role === 'admin' && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => onManageHumans(task)}>ℹ️ Thông tin lớp học</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(task.id)}>🗑️</button>
          </>
        )}
        {role === 'teacher' && (
          <button className="btn btn-primary btn-sm" onClick={() => onStart(task)}>▶ Bắt đầu</button>
        )}
      </div>
    </div>
  );
}

function NewTaskModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [shift, setShift] = useState(1);
  const [numSessions, setNumSessions] = useState(1);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    import('./lib/auth').then(m => m.getTeachers()).then(data => {
      setTeachers(data || []);
      if (data && data.length > 0) setTeacherId(data[0].id);
    });
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onSave({
      name: name.trim(),
      teacher_id: teacherId || null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      shift: parseInt(shift),
      num_sessions: parseInt(numSessions)
    });
    setLoading(false);
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <div className="modal-title">➕ Tạo Lớp học mới</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Tên Lớp học</label>
          <input className="form-input" placeholder="VD: CNTT-K22A..."
            value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Giảng viên phụ trách</label>
          <select className="form-input" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
            <option value="">-- Không gán --</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.email}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Ngày bắt đầu</label>
            <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Ca học (1-5)</label>
            <select className="form-input" value={shift} onChange={e => setShift(e.target.value)}>
              <option value={1}>Ca 1 (06:45 - 09:15)</option>
              <option value={2}>Ca 2 (09:25 - 11:55)</option>
              <option value={3}>Ca 3 (12:10 - 14:40)</option>
              <option value={4}>Ca 4 (14:50 - 17:20)</option>
              <option value={5}>Ca 5 (17:30 - 20:00)</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Số buổi học</label>
          <input type="number" min="1" max="20" className="form-input" value={numSessions} onChange={e => setNumSessions(e.target.value)} />
        </div>
        <div className="modal-footer" style={{ marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || loading}>
            {loading ? <span className="spinner" /> : '💾 Tạo Lớp'}
          </button>
        </div>
      </div>
    </div>
  );
}



function BuoiHocModal({ task, onClose, router }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  // Đồng hồ thực tế — cập nhật mỗi giây để UI tự unlock khi đến giờ
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  
  useEffect(() => {
    getTaskSessions(task.id)
      .then(s => {
        const today = new Date().toLocaleDateString('vi-VN');
        const todaySessions = (s || []).filter(x => new Date(x.start).toLocaleDateString('vi-VN') === today);
        setSessions(todaySessions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [task.id]);

  const handleStartSession = async (type) => {
    try {
      let sid;
      if (type === 'Check-in') {
        const s = getSessionByType('Check-in');
        if (s) {
          // Kích hoạt phiên đã lên lịch (PENDING → ACTIVE)
          if (s.status !== 'ACTIVE') {
            await updateSessionStatus(s.id, 'ACTIVE');
          }
          sid = s.id;
        } else {
          // Chưa có phiên nào - tạo mới ở trạng thái ACTIVE
          const res = await createSession(task.id, 0.5, type);
          sid = res.id;
        }
      } else {
        // Check-out
        const existingOut = getSessionByType('Check-out');
        if (existingOut) {
          if (existingOut.status !== 'ACTIVE') {
            await updateSessionStatus(existingOut.id, 'ACTIVE');
          }
          sid = existingOut.id;
        } else {
          const s = getSessionByType('Check-in');
          const note = s ? `${s.note} (Check-out)` : 'Check-out';
          const res = await createSession(task.id, 0.5, note);
          sid = res.id;
        }
      }
      router.push(`/attendance?taskId=${task.id}&sessionId=${sid}`);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const scheduledSession = sessions.find(s => !s.note?.includes('Check-out') && !s.note?.includes('Check-in'));
  
  const getSessionByType = (type) => {
    if (type === 'Check-in') {
      return scheduledSession || sessions.find(s => s.note === 'Check-in');
    }
    return sessions.find(s => s.note?.includes('Check-out'));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-title">📖 Buổi học hôm nay: {task.name}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '20px 0' }}>
          {loading ? <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div> : (
            !scheduledSession ? (
              // Không có buổi học nào hôm nay → hiện thông báo
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Không có buổi học hôm nay</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lớp học này không có lịch điểm danh trong ngày {new Date().toLocaleDateString('vi-VN')}.</div>
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { type: 'Check-in', label: '🕒 Phiên Check-in', icon: '🛫' },
                { type: 'Check-out', label: '🕒 Phiên Check-out', icon: '🛬' }
              ].map(item => {
                const s = getSessionByType(item.type);
                const isActive = s?.status === 'ACTIVE';
                const isClosed = s?.status === 'CLOSED';
                
                const checkin = getSessionByType('Check-in');
                const isCheckinFinished = checkin?.status === 'CLOSED';
                
                let isDisabled = false;
                let statusText = '';
                
                if (item.type === 'Check-out') {
                  isDisabled = !isCheckinFinished;
                  statusText = isDisabled ? '🔒 Đợi xong Check-in' : isClosed ? '✅ Đã hoàn thành' : isActive ? '🟢 Đang diễn ra' : '⚪ Chưa bắt đầu';
                } else {
                  // Check-in: kiểm tra thời gian thực
                  if (isActive) {
                    statusText = '🟢 Đang diễn ra';
                  } else if (isClosed) {
                    statusText = '✅ Đã hoàn thành';
                  } else if (scheduledSession) {
                    const startDt = new Date(scheduledSession.start);
                    const endDt   = new Date(scheduledSession.end);
                    // Cho phép mở sớm 10 phút
                    const allowedStart = new Date(startDt.getTime() - 10 * 60000);
                    
                    if (now < allowedStart) {
                      isDisabled = true;
                      // Hiển thị đếm ngược
                      const diffMs = allowedStart - now;
                      const diffMin = Math.floor(diffMs / 60000);
                      const diffSec = Math.floor((diffMs % 60000) / 1000);
                      const startStr = startDt.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
                      statusText = diffMin > 0
                        ? `🔒 Còn ${diffMin} phút ${diffSec}s (${startStr})`
                        : `🔒 Còn ${diffSec}s nữa mở`;
                    } else if (now > endDt) {
                      isDisabled = true;
                      statusText = `⏰ Đã hết giờ (${endDt.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})})`;
                    } else {
                      statusText = '⚪ Đến giờ — có thể bắt đầu';
                    }
                  } else {
                    statusText = '⚪ Chưa bắt đầu';
                  }
                }
                
                return (
                  <div key={item.type} className="card" style={{ 
                    padding: 20, textAlign: 'center', 
                    border: isActive ? '2px solid var(--success)' : '1px solid var(--border)',
                    background: isActive ? 'rgba(26,143,111,0.05)' : isDisabled ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    opacity: isDisabled ? 0.6 : 1
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                      {statusText}
                    </div>
                    {!isClosed && (
                      <button 
                        className={`btn btn-sm ${isActive ? 'btn-success' : 'btn-primary'}`}
                        style={{ width: '100%' }}
                        onClick={() => handleStartSession(item.type)}
                        disabled={isDisabled}
                      >
                        {isActive ? 'Vào tiếp' : 'Bắt đầu'}
                      </button>
                    )}
                    {isClosed && (
                      <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, padding: '8px 0' }}>✅ Đã kết thúc</div>
                    )}
                  </div>
                );
              })}
            </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [taskSessions, setTaskSessions] = useState({}); // taskId -> sessions[]
  const [humans, setHumans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [managingTask, setManagingTask] = useState(null);
  const [buoiHocTask, setBuoiHocTask] = useState(null);
  const [starting, setStarting] = useState(null);
  const [time, setTime] = useState('');
  
  // Teacher filters
  const [filterMode, setFilterMode] = useState('today');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('vi-VN'));
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([getTasks(), getHumans()])
      .then(([t, h]) => {
        setTasks(t || []);
        setHumans(h || []);
        // Nếu là teacher: load sessions để biết lớp nào có buổi học hôm nay
        if (t && t.length > 0) {
          Promise.all(t.map(task => getTaskSessions(task.id).then(s => ({ taskId: task.id, sessions: s || [] })).catch(() => ({ taskId: task.id, sessions: [] }))))
            .then(results => {
              const map = {};
              results.forEach(r => { map[r.taskId] = r.sessions; });
              setTaskSessions(map);
            });
        }
      })
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (authLoading) return <AppShell title="Đang tải..." />;

  // Lọc lớp học: Teacher chỉ thấy lớp có buổi học hôm nay (so sánh ngày của session.start)
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const displayTasks = (role === 'teacher' && filterMode === 'today')
    ? tasks.filter(task => {
        const sessions = taskSessions[task.id] || [];
        return sessions.some(s => new Date(s.start).toLocaleDateString('vi-VN') === todayStr);
      })
    : tasks;

  return (
    <AppShell
      title={role === 'admin' ? "Dashboard Quản Trị" : "Dashboard Giảng Viên"}
      subtitle={`Hôm nay, ${mounted ? new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}`}
      actions={
        role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Tạo Lớp học mới
          </button>
        )
      }
    >
      {/* Stats (Admin only) */}
      {role === 'admin' && (
        <>
          <div className="stat-grid">
            {[
              { label: 'Tổng sinh viên', value: loading ? '…' : humans.length, color: 'primary', icon: '👥' },
              { label: 'Lớp học đang hoạt động', value: loading ? '…' : tasks.length, color: 'gold', icon: '🎓' },
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
        </>
      )}

      {/* Tasks list */}
      <div className={`card ${role === 'admin' ? 'mt-24' : ''}`}>
        <div className="card-header">
          <div className="card-title">
            {role === 'admin' ? '📋 Danh sách Lớp học' : '📅 Lớp học cần điểm danh'}
          </div>
          {role === 'teacher' && (
            <div style={{ display: 'flex', gap: 8, background: 'var(--bg-surface)', padding: 4, borderRadius: 8 }}>
              <button className={`btn btn-sm ${filterMode === 'today' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterMode('today')}>Hôm nay</button>
              <button className={`btn btn-sm ${filterMode === 'week' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterMode('week')}>Tuần này</button>
            </div>
          )}
          {role === 'admin' && <span className="badge badge-primary">{displayTasks.length} lớp học</span>}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
          </div>
        ) : displayTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div>{role === 'admin' ? 'Chưa có task nào. Tạo task đầu tiên để bắt đầu điểm danh!' : 'Không có lớp học nào cần điểm danh.'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayTasks.map(task => (
              <div key={task.id} style={{ opacity: starting === task.id ? 0.6 : 1 }}>
                <TaskCard task={task} onStart={(t) => setBuoiHocTask(t)} onDelete={handleDelete} onManageHumans={setManagingTask} role={role} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <NewTaskModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
      {buoiHocTask && <BuoiHocModal task={buoiHocTask} onClose={() => setBuoiHocTask(null)} router={router} />}
      {managingTask && (
        <TaskManagementModal
          task={managingTask}
          allHumans={humans}
          onClose={() => setManagingTask(null)}
          onTaskUpdated={() => {
            getTasks().then(t => setTasks(t || []));
          }}
        />
      )}
    </AppShell>
  );
}
