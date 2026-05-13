'use client';
import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import { getTasks } from '../lib/taskApi';
import { getTaskSessions, getSessionReport, getTaskReport, overrideAttendance } from '../lib/sessionApi';

// ─── Override Modal ───────────────────────────────────────────────────────────
function OverrideModal({ target, sessionId, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!target) return null;

  const newAttended = !target.attended;

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Vui lòng nhập lý do'); return; }
    setLoading(true); setError('');
    try {
      await overrideAttendance(sessionId, target.task_human_session_id, newAttended, reason.trim());
      onSuccess();
    } catch (e) {
      setError(e.message || 'Lỗi khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        padding: 28, width: 420, maxWidth: '95vw',
        border: '1px solid var(--border-bright)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>✏️ Sửa thủ công điểm danh</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          <strong>{target.name}</strong>: {target.attended ? '✓ Có mặt' : '✗ Vắng'}
          &nbsp;→&nbsp;
          <strong style={{ color: newAttended ? 'var(--success)' : 'var(--danger)' }}>
            {newAttended ? '✓ Có mặt' : '✗ Vắng'}
          </strong>
        </div>
        <div className="form-group">
          <label className="form-label">Lý do <span style={{ color: 'var(--danger)' }}>*</span></label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="VD: Camera bị lỗi đầu buổi, sinh viên xác nhận có mặt..."
            value={reason}
            onChange={e => { setReason(e.target.value); setError(''); }}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
            autoFocus
          />
          {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
          ⚠️ Hành động này sẽ được ghi lại vào audit log. Không thể xóa lịch sử chỉnh sửa.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !reason.trim()}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✓ Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Audit log badge ──────────────────────────────────────────────────────────
function AuditBadge({ auditLogs }) {
  const [open, setOpen] = useState(false);
  if (!auditLogs?.length) return null;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="badge badge-warning"
        style={{ cursor: 'pointer', border: 'none', fontSize: 11 }}
        onClick={() => setOpen(v => !v)}
        title="Đã sửa thủ công — click để xem lịch sử"
      >
        ✏️ Đã sửa ({auditLogs.length})
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 100,
          background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
          borderRadius: 8, padding: 12, minWidth: 280, fontSize: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Lịch sử chỉnh sửa</div>
          {auditLogs.map((a, i) => (
            <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < auditLogs.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(a.changed_at).toLocaleString('vi-VN')}</div>
              <div>
                <span style={{ color: a.old_value ? 'var(--success)' : 'var(--danger)' }}>{a.old_value ? 'Có mặt' : 'Vắng'}</span>
                {' → '}
                <span style={{ color: a.new_value ? 'var(--success)' : 'var(--danger)' }}>{a.new_value ? 'Có mặt' : 'Vắng'}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{a.reason}"</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mini Heatmap ─────────────────────────────────────────────────────────────
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [taskReport, setTaskReport] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionReport, setSessionReport] = useState(null);
  const [tab, setTab] = useState('sessions');
  const [loading, setLoading] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null); // { task_human_session_id, name, attended }

  useEffect(() => {
    getTasks().then(t => {
      setTasks(t || []);
      if (t?.length > 0) setSelectedTaskId(String(t[0].id));
    }).catch(console.error);
  }, []);

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

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setSessionReport(null);
    try {
      const r = await getSessionReport(session.id);
      setSessionReport(r);
    } catch (err) { console.error(err); }
  };

  const reloadSessionReport = async () => {
    if (!selectedSession) return;
    try {
      const r = await getSessionReport(selectedSession.id);
      setSessionReport(r);
    } catch (err) { console.error(err); }
  };

  const exportCSV = () => {
    if (!sessionReport) return;
    const rows = sessionReport.details.map(d =>
      `${d.human_id},"${d.name}",${d.attended ? 'CÓ MẶT' : 'VẮNG'},${d.detection_count},${d.first_detected || ''},${d.last_detected || ''},${d.manually_edited ? 'Đã sửa tay' : ''}`
    );
    const blob = new Blob([`ID,Họ tên,Trạng thái,Lần phát hiện,Đầu tiên,Cuối cùng,Ghi chú\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
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
      {/* Override Modal */}
      <OverrideModal
        target={overrideTarget}
        sessionId={selectedSession?.id}
        onClose={() => setOverrideTarget(null)}
        onSuccess={() => { setOverrideTarget(null); reloadSessionReport(); }}
      />

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

      {/* Detail tab — có nút sửa thủ công */}
      {tab === 'detail' && (
        <div>
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

          {/* Hướng dẫn sửa tay */}
          {sessionReport && (
            <div style={{ marginBottom: 12, padding: '10px 16px', background: 'rgba(196,154,104,0.1)', border: '1px solid rgba(196,154,104,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              ✏️ <strong>Chỉnh sửa thủ công:</strong> Click vào nút bên phải mỗi sinh viên để sửa trạng thái. Mọi thay đổi đều được ghi lại (ai sửa, lúc nào, lý do).
            </div>
          )}

          {sessionReport ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sinh viên</th>
                      <th>Trạng thái</th>
                      <th>Lần phát hiện</th>
                      <th>Đầu tiên</th>
                      <th>Cuối cùng</th>
                      <th style={{ width: 110 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionReport.details.map(d => (
                      <tr key={d.task_human_session_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: d.attended ? 'var(--success)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: d.attended ? 'white' : 'var(--text-muted)', flexShrink: 0 }}>
                              {d.name.split(' ').slice(-1)[0][0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{d.human_id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            {d.attended
                              ? <span className="badge badge-success">✓ Có mặt</span>
                              : <span className="badge badge-danger">✗ Vắng</span>
                            }
                            <AuditBadge auditLogs={d.audit_logs} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{d.detection_count} lần</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.first_detected ? new Date(d.first_detected).toLocaleTimeString('vi-VN') : '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.last_detected ? new Date(d.last_detected).toLocaleTimeString('vi-VN') : '—'}</td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                            onClick={() => setOverrideTarget(d)}
                            title="Sửa thủ công trạng thái điểm danh"
                          >
                            ✏️ Sửa
                          </button>
                        </td>
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
