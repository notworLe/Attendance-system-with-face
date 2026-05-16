'use client';
import { useState, useEffect, useMemo } from 'react';
import AppShell from '../components/AppShell';
import { getTasks } from '../lib/taskApi';
import { getTaskSessions, getSessionReport, getTaskReport, overrideAttendance } from '../lib/sessionApi';
import { useAuth } from '../lib/AuthContext';

// ─── Override Modal ───────────────────────────────────────────────────────────
function OverrideModal({ target, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!target) return null;

  // target = { session_id, task_human_session_id, name, attended }
  const newAttended = !target.attended;

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Vui lòng nhập lý do'); return; }
    setLoading(true); setError('');
    try {
      await overrideAttendance(target.session_id, target.task_human_session_id, newAttended, reason.trim());
      onSuccess();
    } catch (e) {
      setError(e.message || 'Lỗi khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title">✏️ Sửa thủ công điểm danh</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 4 }}>Sinh viên: <strong>{target.name}</strong></div>
          <div>Trạng thái: {target.attended ? <span style={{color: 'var(--danger)', fontWeight: 600}}>Có mặt → Vắng</span> : <span style={{color: 'var(--success)', fontWeight: 600}}>Vắng → Có mặt</span>}</div>
        </div>

        <div className="form-group">
          <label className="form-label">Lý do <span style={{ color: 'var(--danger)' }}>*</span></label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="VD: Camera bị lỗi đầu buổi, sinh viên xác nhận có mặt..."
            value={reason}
            onChange={e => { setReason(e.target.value); setError(''); }}
            style={{ resize: 'vertical', minHeight: 80 }}
            autoFocus
          />
          {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span>Hành động này sẽ được ghi lại vào audit log. Không thể xóa lịch sử chỉnh sửa.</span>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !reason.trim()}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '✓ Xác nhận'}
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
  const { role, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [taskReport, setTaskReport] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [dateReport, setDateReport] = useState(null);
  
  const [tab, setTab] = useState('sessions');
  const [loading, setLoading] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);

  // Nhóm sessions theo Ngày học
  const groupedDates = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const date = new Date(s.start).toLocaleDateString('vi-VN');
      if (!map[date]) map[date] = [];
      map[date].push(s);
    });
    return Object.keys(map).sort((a, b) => {
      const partsA = a.split('/'); const partsB = b.split('/');
      return new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`) - new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`);
    }).map(date => ({
      date,
      sessions: map[date].sort((a,b) => new Date(a.start) - new Date(b.start))
    }));
  }, [sessions]);

  useEffect(() => {
    getTasks().then(t => {
      setTasks(t || []);
      if (t?.length > 0) setSelectedTaskId(String(t[0].id));
    }).catch(console.error);
  }, [role]);

  useEffect(() => {
    if (!selectedTaskId) return;
    setLoading(true);
    setSessions([]); setTaskReport(null); setSelectedDate(''); setDateReport(null);
    Promise.all([
      getTaskSessions(selectedTaskId),
      getTaskReport(selectedTaskId),
    ]).then(([s, r]) => {
      setSessions(s || []);
      setTaskReport(r);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTaskId]);

  const handleSelectDate = async (date) => {
    setSelectedDate(date);
    setDateReport(null);
    if (!date) return;
    const dateObj = groupedDates.find(d => d.date === date);
    if (!dateObj) return;

    try {
        const reports = await Promise.all(dateObj.sessions.map(s => getSessionReport(s.id)));
        
        const mergedDetails = {};
        let total = 0;
        
        reports.forEach((rep, idx) => {
           if (idx === 0) total = rep.total;
           rep.details.forEach(d => {
              if (!mergedDetails[d.human_id]) {
                 mergedDetails[d.human_id] = {
                    human_id: d.human_id,
                    name: d.name,
                    checkin: null,
                    checkout: null,
                 };
              }
              const isCheckout = rep.note?.includes('Check-out');
              // Phiên check-in là phiên chính (lên lịch) hoặc phiên có note chứa 'Check-in'
              const isCheckin = !isCheckout;  // Mọi phiên không phải checkout đều là check-in
              
              const sessionData = {
                  task_human_session_id: d.task_human_session_id,
                  attended: d.attended,
                  time: d.first_detected,
                  session_id: rep.session_id,
                  audit_logs: d.audit_logs
              };
              
              if (isCheckin) mergedDetails[d.human_id].checkin = sessionData;
              if (isCheckout) mergedDetails[d.human_id].checkout = sessionData;
           });
        });

        let attendedFull = 0;
        const detailsArr = Object.values(mergedDetails).map(m => {
            const hasP1 = !!m.checkin;
            const hasP2 = !!m.checkout;
            const p1 = m.checkin?.attended;
            const p2 = m.checkout?.attended;
            
            let status = 'Vắng';
            if (hasP1 && hasP2) {
                if (p1 && p2) status = 'Có mặt';
                else if (p1 && !p2) status = 'Trốn học';
                else if (!p1 && p2) status = 'Trễ học';
                else status = 'Vắng';
            } else if (hasP1) {
                status = p1 ? 'Có mặt' : 'Vắng';
            } else if (hasP2) {
                status = p2 ? 'Có mặt' : 'Vắng';
            }
            
            if (status === 'Có mặt') attendedFull++;
            return { ...m, status };
        });

        setDateReport({
           date,
           total,
           attendedFull,
           sessionsCount: dateObj.sessions.length,
           details: detailsArr
        });
    } catch(err) {
        console.error(err);
    }
  };

  const reloadDateReport = () => {
    if (selectedDate) handleSelectDate(selectedDate);
  };

  const exportCSV = () => {
    if (!dateReport) return;
    const rows = dateReport.details.map(d =>
      `${d.human_id},"${d.name}",${d.status},${d.checkin?.attended ? 'CÓ MẶT' : 'Vắng'},${d.checkout ? (d.checkout.attended ? 'CÓ MẶT' : 'Vắng') : '—'}`
    );
    const blob = new Blob([`ID,Họ tên,Trạng thái,Check-in,Check-out\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `baocao_ngay_${selectedDate.replace(/\//g,'-')}.csv`; a.click();
  };

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('vi-VN') : '—';
  const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN') : '—';

  if (authLoading) return <AppShell title="Đang tải..." />;

  return (
    <AppShell
      title="Báo cáo Điểm danh"
      subtitle={role === 'admin' ? "Thống kê tất cả các lớp học" : "Thống kê lớp học của bạn"}
      actions={
        <>
          {dateReport && <button className="btn btn-secondary" onClick={exportCSV}>📥 Xuất CSV</button>}
        </>
      }
    >
      <OverrideModal
        target={overrideTarget}
        onClose={() => setOverrideTarget(null)}
        onSuccess={() => { setOverrideTarget(null); reloadDateReport(); }}
      />

      <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label">Chọn Lớp học (Task)</label>
          <select className="form-input form-select" value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}>
            <option value="">-- Chọn lớp học --</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {taskReport && (
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <span>📋 <strong>{groupedDates.length}</strong> buổi học</span>
            <span>📊 Tỷ lệ TB: <strong style={{ color: taskReport.overall_attendance_rate >= 80 ? 'var(--success)' : 'var(--warning)' }}>
              {taskReport.overall_attendance_rate.toFixed(1)}%
            </strong></span>
          </div>
        )}
      </div>

      {taskReport && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Tổng số Buổi học', value: groupedDates.length, color: 'primary' },
            { label: 'Tổng Phiên (Check-in/out)', value: taskReport.total_sessions, color: 'primary' },
            { label: 'Tỷ lệ TB toàn kỳ', value: `${taskReport.overall_attendance_rate.toFixed(1)}%`, color: taskReport.overall_attendance_rate >= 80 ? 'green' : 'yellow' },
          ].map((s, i) => (
            <div key={i} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {[['sessions','📋 Lịch sử các phiên'],['detail','👤 Điểm danh theo ngày'],['heatmap','🗓️ Bản đồ nhiệt']].map(([key, label]) => (
          <button key={key} className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />)}
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              {selectedTaskId ? 'Chưa có buổi điểm danh nào' : 'Chọn lớp học để xem lịch sử'}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID Phiên</th><th>Ngày</th><th>Bắt đầu</th><th>Kết thúc</th><th>Ngưỡng</th><th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{s.id}</td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{new Date(s.start).toLocaleDateString('vi-VN')}</td>
                      <td style={{ fontSize: 12 }}>{fmtTime(s.start)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtTime(s.end)}</td>
                      <td><span className="badge badge-muted">{s.threshold}</span></td>
                      <td><span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-muted'}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'detail' && (
        <div>
          <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Chọn Buổi học (Ngày)</label>
              <select className="form-input form-select" value={selectedDate} onChange={e => handleSelectDate(e.target.value)}>
                <option value="">-- Chọn ngày --</option>
                {groupedDates.map(g => <option key={g.date} value={g.date}>Buổi ngày {g.date} ({g.sessions.length} phiên)</option>)}
              </select>
            </div>
            {dateReport && (
              <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                <span>✅ <strong style={{ color: 'var(--success)' }}>{dateReport.attendedFull}</strong>/{dateReport.total} có mặt đủ</span>
                <span>📊 <strong>{((dateReport.attendedFull / dateReport.total) * 100).toFixed(1)}%</strong></span>
              </div>
            )}
          </div>

          {dateReport && (
            <div style={{ marginBottom: 12, padding: '10px 16px', background: 'rgba(196,154,104,0.1)', border: '1px solid rgba(196,154,104,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              ✏️ <strong>Sửa thủ công:</strong> Click vào nút bên cạnh phiên Check-in hoặc Check-out để cập nhật trạng thái nếu cần.
            </div>
          )}

          {dateReport ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sinh viên</th>
                      <th>Trạng thái tổng hợp</th>
                      <th>Phiên 1 (Check-in)</th>
                      {dateReport.sessionsCount > 1 && <th>Phiên 2 (Check-out)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {dateReport.details.map(d => (
                      <tr key={d.human_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ 
                                width: 32, height: 32, borderRadius: '50%', 
                                background: d.status === 'Có mặt' ? 'var(--success)' : 
                                            d.status === 'Trốn học' ? 'var(--gold)' :
                                            d.status === 'Trễ học' ? '#3b82f6' : 'var(--bg-hover)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                fontSize: 12, fontWeight: 700, 
                                color: (d.status === 'Vắng') ? 'var(--text-muted)' : 'white', 
                                flexShrink: 0 
                            }}>
                              {d.name.split(' ').slice(-1)[0][0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{d.human_id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge`} style={{
                              background: d.status === 'Có mặt' ? 'rgba(26,143,111,0.1)' : 
                                         d.status === 'Trốn học' ? 'rgba(196,154,104,0.1)' :
                                         d.status === 'Trễ học' ? 'rgba(59,130,246,0.1)' : 'rgba(220,53,69,0.1)',
                              color: d.status === 'Có mặt' ? 'var(--success)' : 
                                     d.status === 'Trốn học' ? 'var(--gold)' :
                                     d.status === 'Trễ học' ? '#3b82f6' : 'var(--danger)',
                              border: `1px solid ${d.status === 'Có mặt' ? 'var(--success)' : 
                                     d.status === 'Trốn học' ? 'var(--gold)' :
                                     d.status === 'Trễ học' ? '#3b82f6' : 'var(--danger)'}`
                          }}>
                            {d.status}
                          </span>
                        </td>
                        {/* Check-in column */}
                        <td>
                          {d.checkin ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: d.checkin.attended ? 'var(--success)' : 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
                                    {d.checkin.attended ? '✓ Có' : '✗ Vắng'}
                                </span>
                                <AuditBadge auditLogs={d.checkin.audit_logs} />
                                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => setOverrideTarget({ session_id: d.checkin.session_id, task_human_session_id: d.checkin.task_human_session_id, name: d.name, attended: d.checkin.attended })}>
                                  Sửa
                                </button>
                            </div>
                          ) : '—'}
                        </td>
                        {/* Check-out column */}
                        {dateReport.sessionsCount > 1 && (
                          <td>
                            {d.checkout ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: d.checkout.attended ? 'var(--success)' : 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
                                        {d.checkout.attended ? '✓ Có' : '✗ Vắng'}
                                    </span>
                                    <AuditBadge auditLogs={d.checkout.audit_logs} />
                                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => setOverrideTarget({ session_id: d.checkout.session_id, task_human_session_id: d.checkout.task_human_session_id, name: d.name, attended: d.checkout.attended })}>
                                      Sửa
                                    </button>
                                </div>
                            ) : '—'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              {selectedDate === '' ? 'Chọn buổi học để xem báo cáo chi tiết' : <span className="spinner" style={{ margin: '0 auto' }} />}
            </div>
          )}
        </div>
      )}

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
