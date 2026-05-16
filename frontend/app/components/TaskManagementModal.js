'use client';
import { useState, useEffect } from 'react';
import { getTaskHumans, addHumanToTask, removeHumanFromTask, updateTask } from '../lib/taskApi';
import { getTaskSessions, updateSession, deleteSession, createSession } from '../lib/sessionApi';

const SHIFT_MAP = {
  1: 'Ca 1 (06:45 - 09:15)',
  2: 'Ca 2 (09:25 - 11:55)',
  3: 'Ca 3 (12:10 - 14:40)',
  4: 'Ca 4 (14:50 - 17:20)',
  5: 'Ca 5 (17:30 - 20:00)'
};

const SHIFT_TIMES = {
    1: { sh: 6, sm: 45, eh: 9, em: 15 },
    2: { sh: 9, sm: 25, eh: 11, em: 55 },
    3: { sh: 12, sm: 10, eh: 14, em: 40 },
    4: { sh: 14, sm: 50, eh: 17, em: 20 },
    5: { sh: 17, sm: 30, eh: 20, em: 0 },
};

export default function TaskManagementModal({ task, allHumans, onClose, onTaskUpdated }) {
  const [activeTab, setActiveTab] = useState('teacher'); // 'teacher', 'students', 'sessions'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div className="modal-title">ℹ️ Thông tin lớp: {task.name}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {[
            { id: 'teacher', label: 'Thông tin chung' },
            { id: 'students', label: 'Sinh viên' },
            { id: 'sessions', label: 'Buổi học' }
          ].map(t => (
            <div 
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 20px', cursor: 'pointer',
                borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)'
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ maxHeight: 450, overflowY: 'auto', padding: '0 4px' }}>
          {activeTab === 'teacher' && <TeacherTab task={task} onTaskUpdated={onTaskUpdated} />}
          {activeTab === 'students' && <StudentsTab task={task} allHumans={allHumans} />}
          {activeTab === 'sessions' && <SessionsTab task={task} />}
        </div>
      </div>
    </div>
  );
}

function TeacherTab({ task, onTaskUpdated }) {
  const [teacherId, setTeacherId] = useState(task.teacher_id || '');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    import('../lib/auth').then(m => m.getTeachers()).then(data => {
      setTeachers(data || []);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTask(task.id, {
        name: task.name,
        teacher_id: teacherId || null
      });
      alert('Đã cập nhật giảng viên phụ trách');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: 10 }}>
      {loading ? <div>Đang tải...</div> : (
        <div className="form-group">
          <label className="form-label">Giảng viên phụ trách</label>
          <select className="form-input" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
            <option value="">-- Không gán --</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.email}</option>)}
          </select>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      )}
    </div>
  );
}

function StudentsTab({ task, allHumans }) {
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

  if (loading) return <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>;
  if (allHumans.length === 0) return <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Chưa có sinh viên nào.</div>;

  return (
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
  );
}

function SessionsTab({ task }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  // Edit states
  const [editDate, setEditDate] = useState('');
  const [editShift, setEditShift] = useState(1);

  useEffect(() => {
    fetchSessions();
  }, [task.id]);

  const fetchSessions = () => {
    setLoading(true);
    getTaskSessions(task.id)
      .then(s => setSessions((s || []).sort((a, b) => new Date(a.start) - new Date(b.start))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    const d = new Date(s.start);
    const pad = (n) => n.toString().padStart(2, '0');
    setEditDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
    
    // Guess shift from start hour
    const h = d.getHours();
    let guessedShift = 1;
    if (h >= 9 && h < 12) guessedShift = 2;
    if (h >= 12 && h < 14) guessedShift = 3;
    if (h >= 14 && h < 17) guessedShift = 4;
    if (h >= 17) guessedShift = 5;
    setEditShift(guessedShift);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editDate) return;
      const t = SHIFT_TIMES[editShift];
      const startDt = new Date(editDate);
      startDt.setHours(t.sh, t.sm, 0, 0);
      
      const endDt = new Date(editDate);
      endDt.setHours(t.eh, t.em, 0, 0);

      const toLocalISO = (d) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      };

      const currentSession = sessions.find(s => s.id === editingId);
      const newNote = currentSession?.note 
        ? currentSession.note.replace(/Ca \d+/, `Ca ${editShift}`)
        : `Ca ${editShift}`;

      await updateSession(editingId, {
        start: toLocalISO(startDt),
        end: toLocalISO(endDt),
        note: newNote
      });
      setEditingId(null);
      fetchSessions();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleAddSession = async () => {
    try {
      const t = SHIFT_TIMES[1];
      let startDt = new Date();
      startDt.setDate(startDt.getDate() + 1);
      
      if (sessions.length > 0) {
        const sorted = [...sessions].sort((a, b) => new Date(b.start) - new Date(a.start));
        const lastSessionDate = new Date(sorted[0].start);
        startDt = new Date(lastSessionDate);
        startDt.setDate(startDt.getDate() + 7); // 1 week after the last session
      }
      
      startDt.setHours(t.sh, t.sm, 0, 0);
      const endDt = new Date(startDt);
      endDt.setHours(t.eh, t.em, 0, 0);

      const toLocalISO = (d) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      };

      await createSession(
        task.id, 
        0.5, 
        `Buổi bổ sung (Ca 1)`, 
        toLocalISO(startDt), 
        toLocalISO(endDt),
        "PENDING"
      );
      fetchSessions();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa buổi học này? Dữ liệu điểm danh của buổi này cũng sẽ bị xóa.')) return;
    try {
      await deleteSession(id);
      fetchSessions();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={handleAddSession}>➕ Thêm buổi học</button>
      </div>
      {sessions.map((s, idx) => (
        <div key={s.id} style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
          {editingId === s.id ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input type="date" className="form-input" value={editDate} onChange={e => setEditDate(e.target.value)} />
              <select className="form-input" value={editShift} onChange={e => setEditShift(parseInt(e.target.value))}>
                {Object.entries(SHIFT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Hủy</button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>Lưu</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.note || `Buổi học (ID: ${s.id})`}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(s.start).toLocaleString('vi-VN')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => startEdit(s)}>Sửa</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s.id)}>🗑️</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {sessions.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Chưa có buổi học nào được tạo.</div>}
    </div>
  );
}
