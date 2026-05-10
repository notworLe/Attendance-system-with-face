'use client';
import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import { getTasks } from '../lib/taskApi';
import { getTaskSessions, getSessionReport, getTaskReport } from '../lib/sessionApi';

function MiniHeatmap() {
  const weeks = 8; const days = 7;
  const data = Array.from({ length: weeks }, () =>
    Array.from({ length: days }, () => Math.random() > 0.3 ? Math.random() : 0)
  );
  const dayLabels = ['T2','T3','T4','T5','T6','T7','CN'];
  return (
    <div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
        {dayLabels.map(d => <div key={d} style={{ flex: 1, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{d}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', gap: 2 }}>
            {week.map((v, di) => (
              <div key={di} style={{
                flex: 1, height: 14, borderRadius: 3,
                background: v === 0 ? 'var(--bg-hover)'
                  : v < 0.5 ? 'rgba(20,58,81,0.25)'
                  : v < 0.8 ? 'rgba(20,58,81,0.55)'
                  : 'var(--primary)',
              }} title={`${Math.round(v * 100)}%`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [taskReport, setTaskReport] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionReport, setSessionReport] = useState(null);
  const [tab, setTab] = useState('sessions');
  const [loading, setLoading] = useState(false);

  // Load tasks
  useEffect(() => {
    getTasks().then(t => {
      setTasks(t || []);
      if (t?.length > 0) setSelectedTaskId(String(t[0].id));
    }).catch(console.error);
  }, []);

  // Load sessions + task report when task changes
  useEffect(() => {
    if (!selectedTaskId) return;
    setLoading(true);
    setSessions([]); setTaskReport(null); setSelectedSession(null); setSessionReport(null);
    Promise.all([
      getTaskSessions(selectedTaskId),
      getTaskReport(selectedTaskId),
    ]).then(([s, r]) => {
      setSessions(s || []);
      setTaskReport(r);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTaskId]);

  // Load session report when session selected
  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setSessionReport(null);
    try {
      const r = await getSessionReport(session.id);
      setSessionReport(r);
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    if (!sessionReport) return;
    const rows = sessionReport.details.map(d =>
      `${d.human_id},${d.name},${d.attended ? 'CÓ MẶT' : 'VẮNG'},${d.detection_count},${d.first_detected || ''},${d.last_detected || ''}`
    );
    const blob = new Blob([`ID,Họ tên,Trạng thái,Lần phát hiện,Đầu tiên,Cuối cùng\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `baocao_session_${selectedSession?.id}.csv`; a.click();
  };

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('vi-VN') : '—';
  const statusColor = (s) => s === 'ACTIVE' ? 'badge-success' : s === 'CLOSED' ? 'badge-muted' : 'badge-warning';

  return (
    <AppShell
      title="Báo cáo Điểm danh"
      subtitle="Thống kê và xuất dữ liệu điểm danh"
      actions={
        <>
          {sessionReport && <button className="btn btn-secondary" onClick={exportCSV}>📥 Xuất CSV</button>}
        </>
      }
    >
      {/* Task selector */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label">Chọn Task</label>
          <select className="form-input form-select" value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}>
            <option value="">-- Chọn task --</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {taskReport && (
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <span>📋 <strong>{taskReport.total_sessions}</strong> buổi</span>
            <span>📊 Tỷ lệ TB: <strong style={{ color: taskReport.overall_attendance_rate >= 80 ? 'var(--success)' : 'var(--warning)' }}>
              {taskReport.overall_attendance_rate.toFixed(1)}%
            </strong></span>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {taskReport && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Tổng buổi học', value: taskReport.total_sessions, color: 'primary' },
            { label: 'Tỷ lệ TB toàn kỳ', value: `${taskReport.overall_attendance_rate.toFixed(1)}%`, color: taskReport.overall_attendance_rate >= 80 ? 'green' : 'yellow' },
            { label: 'Buổi gần nhất', value: sessions[0] ? fmtDate(sessions[0]?.start).split(',')[0] : '—', color: 'gold' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {[['sessions','📋 Theo buổi học'],['detail','👤 Chi tiết buổi'],['heatmap','🗓️ Bản đồ nhiệt']].map(([key, label]) => (
          <button key={key} className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />)}
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              {selectedTaskId ? 'Chưa có buổi điểm danh nào' : 'Chọn task để xem lịch sử'}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Bắt đầu</th><th>Kết thúc</th><th>Ngưỡng</th><th>Trạng thái</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} style={{ cursor: 'pointer' }}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{s.id}</td>
                      <td style={{ fontSize: 12 }}>{fmtDate(s.start)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(s.end)}</td>
                      <td><span className="badge badge-muted">{s.threshold}</span></td>
                      <td><span className={`badge ${statusColor(s.status)}`}>{s.status}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setTab('detail'); handleSelectSession(s); }}>
                          Chi tiết →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail tab */}
      {tab === 'detail' && (
        <div>
          {/* Session selector */}
          <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Chọn buổi học</label>
              <select className="form-input form-select" value={selectedSession?.id || ''} onChange={e => { const s = sessions.find(x => x.id === +e.target.value); if (s) handleSelectSession(s); }}>
                <option value="">-- Chọn buổi --</option>
                {sessions.map(s => <option key={s.id} value={s.id}>Buổi #{s.id} — {fmtDate(s.start)}</option>)}
              </select>
            </div>
            {sessionReport && (
              <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                <span>✅ <strong style={{ color: 'var(--success)' }}>{sessionReport.attended}</strong>/{sessionReport.total} có mặt</span>
                <span>📊 <strong>{sessionReport.attendance_rate.toFixed(1)}%</strong></span>
              </div>
            )}
          </div>

          {sessionReport ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Sinh viên</th><th>Trạng thái</th><th>Lần phát hiện</th><th>Đầu tiên</th><th>Cuối cùng</th></tr>
                  </thead>
                  <tbody>
                    {sessionReport.details.map(d => (
                      <tr key={d.human_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: d.attended ? 'var(--success)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: d.attended ? 'white' : 'var(--text-muted)' }}>
                              {d.name.split(' ').slice(-1)[0][0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{d.human_id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {d.attended
                            ? <span className="badge badge-success">✓ Có mặt</span>
                            : <span className="badge badge-danger">✗ Vắng</span>
                          }
                        </td>
                        <td style={{ fontWeight: 600 }}>{d.detection_count} lần</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.first_detected ? new Date(d.first_detected).toLocaleTimeString('vi-VN') : '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.last_detected ? new Date(d.last_detected).toLocaleTimeString('vi-VN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              {selectedSession ? <span className="spinner" style={{ margin: '0 auto' }} /> : 'Chọn buổi học để xem báo cáo chi tiết'}
            </div>
          )}
        </div>
      )}

      {/* Heatmap tab */}
      {tab === 'heatmap' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">🗓️ Bản đồ nhiệt điểm danh — 8 tuần gần nhất</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              {[['var(--bg-hover)', 'Nghỉ'], ['rgba(20,58,81,0.3)', 'Thấp'], ['var(--primary)', 'Cao']].map(([bg, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 14, height: 14, background: bg, borderRadius: 2 }} /> {label}
                </div>
              ))}
            </div>
          </div>
          <MiniHeatmap />
        </div>
      )}
    </AppShell>
  );
}
