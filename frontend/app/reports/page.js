'use client';
import { useState } from 'react';
import AppShell from '../components/AppShell';

const SESSIONS = [
  { id: 1, date: '26/04/2026', class: 'CNTT-K22A', subject: 'Lập trình Web',    time: '07:30-09:15', present: 32, total: 35, absent: 3 },
  { id: 2, date: '26/04/2026', class: 'CNTT-K22B', subject: 'Cơ sở dữ liệu',   time: '09:30-11:15', present: 28, total: 33, absent: 5 },
  { id: 3, date: '25/04/2026', class: 'CNTT-K22A', subject: 'Lập trình Web',    time: '07:30-09:15', present: 30, total: 35, absent: 5 },
  { id: 4, date: '25/04/2026', class: 'CNTT-K23A', subject: 'Mạng máy tính',   time: '13:00-14:45', present: 36, total: 38, absent: 2 },
  { id: 5, date: '24/04/2026', class: 'CNTT-K22B', subject: 'Cơ sở dữ liệu',   time: '09:30-11:15', present: 31, total: 33, absent: 2 },
  { id: 6, date: '23/04/2026', class: 'CNTT-K22A', subject: 'Lập trình Web',    time: '07:30-09:15', present: 29, total: 35, absent: 6 },
];

const STUDENT_DETAIL = [
  { id: 'SV001', name: 'Nguyễn Văn An',   sessions: 10, present: 9,  rate: 90 },
  { id: 'SV002', name: 'Trần Thị Bình',   sessions: 10, present: 7,  rate: 70 },
  { id: 'SV003', name: 'Lê Hoàng Cường',  sessions: 10, present: 10, rate: 100 },
  { id: 'SV004', name: 'Phạm Thị Dung',   sessions: 10, present: 6,  rate: 60 },
  { id: 'SV005', name: 'Vũ Minh Đức',     sessions: 10, present: 9,  rate: 90 },
];

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
                  : v < 0.5 ? 'rgba(99,102,241,0.3)'
                  : v < 0.8 ? 'rgba(99,102,241,0.6)'
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
  const [tab, setTab] = useState('sessions');
  const [dateFrom, setDateFrom] = useState('2026-04-20');
  const [dateTo,   setDateTo]   = useState('2026-04-26');
  const [filterClass, setFilterClass] = useState('all');

  const filtered = SESSIONS.filter(s => filterClass === 'all' || s.class === filterClass);

  const exportCSV = () => {
    const rows = filtered.map(s =>
      `${s.date},${s.class},${s.subject},${s.time},${s.present},${s.total},${Math.round(s.present/s.total*100)}%`
    );
    const blob = new Blob([`Ngày,Lớp,Môn,Giờ,Có mặt,Tổng,Tỷ lệ\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `baocao_diemdanh_${dateFrom}_${dateTo}.csv`; a.click();
  };

  return (
    <AppShell
      title="Báo cáo Điểm danh"
      subtitle="Thống kê và xuất dữ liệu điểm danh"
      actions={
        <>
          <button className="btn btn-secondary" onClick={exportCSV}>📥 Xuất CSV</button>
          <button className="btn btn-primary">🖨️ Xuất PDF</button>
        </>
      }
    >
      {/* ── summary stats ── */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Tổng buổi học', value: filtered.length, color: 'primary' },
          { label: 'Tổng lượt điểm danh', value: filtered.reduce((a, s) => a + s.present, 0), color: 'gold' },
          { label: 'Tỷ lệ TB toàn kỳ', value: `${Math.round(filtered.reduce((a, s) => a + s.present / s.total, 0) / filtered.length * 100)}%`, color: 'green' },
          { label: 'Tổng vắng mặt', value: filtered.reduce((a, s) => a + s.absent, 0), color: 'red' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── filter bar ── */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group">
          <label className="form-label">Từ ngày</label>
          <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Đến ngày</label>
          <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Lớp</label>
          <select className="form-input form-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="all">Tất cả lớp</option>
            <option>CNTT-K22A</option><option>CNTT-K22B</option><option>CNTT-K23A</option>
          </select>
        </div>
        <button className="btn btn-primary">🔍 Lọc</button>
      </div>

      {/* ── tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {[['sessions','📋 Theo buổi học'],['students','👥 Theo sinh viên'],['heatmap','🗓️ Bản đồ nhiệt']].map(([key, label]) => (
          <button key={key} className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── content tabs ── */}
      {tab === 'sessions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th><th>Lớp</th><th>Môn học</th><th>Thời gian</th>
                  <th>Có mặt</th><th>Vắng</th><th>Tỷ lệ</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const pct = Math.round(s.present / s.total * 100);
                  return (
                    <tr key={s.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.date}</td>
                      <td><span className="badge badge-primary">{s.class}</span></td>
                      <td style={{ fontWeight: 500 }}>{s.subject}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.time}</td>
                      <td><span style={{ fontWeight: 600, color: 'var(--success)' }}>{s.present}</span>/{s.total}</td>
                      <td><span style={{ color: s.absent > 3 ? 'var(--danger)' : 'var(--text-secondary)' }}>{s.absent}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-wrap" style={{ width: 60, height: 6 }}>
                            <div className="progress-bar" style={{
                              width: `${pct}%`, height: 6,
                              background: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)',
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                      <td><button className="btn btn-ghost btn-sm">Chi tiết</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'students' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Sinh viên</th><th>Tổng buổi</th><th>Có mặt</th><th>Vắng</th><th>Tỷ lệ</th><th>Nguy cơ</th></tr>
              </thead>
              <tbody>
                {STUDENT_DETAIL.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                          {s.name.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.sessions}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{s.present}</td>
                    <td style={{ color: s.sessions - s.present > 3 ? 'var(--danger)' : 'var(--text-secondary)' }}>{s.sessions - s.present}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-wrap" style={{ width: 72, height: 6 }}>
                          <div className="progress-bar" style={{
                            width: `${s.rate}%`, height: 6,
                            background: s.rate >= 80 ? 'var(--success)' : s.rate >= 60 ? 'var(--warning)' : 'var(--danger)',
                          }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{s.rate}%</span>
                      </div>
                    </td>
                    <td>
                      {s.rate < 60
                        ? <span className="badge badge-danger">🚨 Nguy hiểm</span>
                        : s.rate < 80
                          ? <span className="badge badge-warning">⚠️ Cảnh báo</span>
                          : <span className="badge badge-success">✓ Tốt</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">🗓️ Bản đồ nhiệt điểm danh — 8 tuần gần nhất</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 14, height: 14, background: 'var(--bg-hover)', borderRadius: 2 }} /> Nghỉ
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 14, height: 14, background: 'rgba(99,102,241,0.3)', borderRadius: 2 }} /> Thấp
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 14, height: 14, background: 'var(--primary)', borderRadius: 2 }} /> Cao
              </div>
            </div>
          </div>
          <MiniHeatmap />
          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)' }}>
            💡 Mỗi ô đại diện cho tỷ lệ điểm danh của một ngày. Màu đậm hơn = tỷ lệ cao hơn.
          </div>
        </div>
      )}
    </AppShell>
  );
}
