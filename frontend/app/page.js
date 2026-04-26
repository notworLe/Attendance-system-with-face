'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from './components/AppShell';

/* ── mock data ── */
const RECENT_SESSIONS = [
  { id: 1, class: 'CNTT-K22A', subject: 'Lập trình Web', time: '07:30 – 09:15', date: '26/04/2026', present: 32, total: 35, status: 'closed' },
  { id: 2, class: 'CNTT-K22B', subject: 'Cơ sở dữ liệu', time: '09:30 – 11:15', date: '26/04/2026', present: 28, total: 33, status: 'closed' },
  { id: 3, class: 'CNTT-K23A', subject: 'Mạng máy tính', time: '13:00 – 14:45', date: '26/04/2026', present: 0,  total: 38, status: 'upcoming' },
];

const ALERTS = [
  { id: 1, type: 'warn',    msg: 'Nguyễn Văn An vắng 3 buổi liên tiếp — CNTT-K22A' },
  { id: 2, type: 'warn',    msg: 'Trần Thị Bình vắng 4 buổi — CNTT-K22B' },
  { id: 3, type: 'success', msg: 'Buổi học 07:30 CNTT-K22A đạt 91.4% điểm danh' },
];

const WEEKLY = [85, 78, 92, 88, 91, 76, 89];
const DAYS   = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function MiniBarChart({ data, days }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 72 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: '100%',
              height: `${(v / max) * 56}px`,
              background: `linear-gradient(180deg, #143A51, #0B1F3A)`,
              borderRadius: '4px 4px 0 0',
              opacity: i === 4 ? 1 : 0.55,
              transition: 'opacity 0.2s',
            }}
            title={`${v}%`}
          />
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{days[i]}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('vi-VN'));
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Hôm nay, ${new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      actions={
        <Link href="/attendance">
          <button className="btn btn-primary">
            📹 Bắt đầu điểm danh
          </button>
        </Link>
      }
    >
      {/* ── Stats ── */}
      <div className="stat-grid">
        {[
          { label: 'Tổng sinh viên', value: '847', color: 'primary', icon: '👥', change: '+12 tháng này', dir: 'up' },
          { label: 'Điểm danh hôm nay', value: '91.4%', color: 'gold', icon: '✅', change: '+3.2% so với tuần trước', dir: 'up' },
          { label: 'Buổi học hôm nay', value: '3', color: 'yellow', icon: '📅', change: '1 buổi sắp tới', dir: null },
          { label: 'SV vắng (tuần)', value: '28', color: 'red', icon: '⚠️', change: '-5 so với tuần trước', dir: 'down' },
          { label: 'Lớp đang hoạt động', value: '12', color: 'green', icon: '🎓', change: 'Học kỳ 2 – 2025/26', dir: null },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.color}`}>{s.value}</div>
            <div className={`stat-change ${s.dir || ''}`}>{s.dir === 'up' ? '↑' : s.dir === 'down' ? '↓' : ''} {s.change}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mt-24">
        {/* ── Weekly chart ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Tỷ lệ điểm danh tuần này</div>
              <div className="card-subtitle">Trung bình: 85.6%</div>
            </div>
            <span className="badge badge-success">↑ Tốt</span>
          </div>
          <MiniBarChart data={WEEKLY} days={DAYS} />
        </div>

        {/* ── Alerts ── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Cảnh báo & Thông báo</div>
            <span className="badge badge-warning">2 cảnh báo</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ALERTS.map((a) => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid ${a.type === 'warn' ? 'var(--gold)' : 'var(--success)'}`,
              }}>
                <span>{a.type === 'warn' ? '⚠️' : '✅'}</span>
                <span style={{ fontSize: 13 }}>{a.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Sessions ── */}
      <div className="card mt-24">
        <div className="card-header">
          <div className="card-title">Phiên điểm danh hôm nay</div>
          <Link href="/reports">
            <button className="btn btn-ghost btn-sm">Xem tất cả →</button>
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lớp</th>
                <th>Môn học</th>
                <th>Thời gian</th>
                <th>Điểm danh</th>
                <th>Tỷ lệ</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {RECENT_SESSIONS.map((s) => {
                const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
                return (
                  <tr key={s.id}>
                    <td><span style={{ fontWeight: 600 }}>{s.class}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.subject}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.time}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{s.present}</span>
                      <span style={{ color: 'var(--text-muted)' }}>/{s.total}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-wrap" style={{ width: 60, height: 6 }}>
                          <div className="progress-bar" style={{
                            width: `${pct}%`, height: 6,
                            background: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)',
                          }} />
                        </div>
                        <span style={{ fontSize: 12 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'closed' ? 'badge-muted' : 'badge-primary'}`}>
                        {s.status === 'closed' ? 'Đã kết thúc' : 'Sắp tới'}
                      </span>
                    </td>
                    <td>
                      <Link href={s.status === 'upcoming' ? '/attendance' : '/reports'}>
                        <button className="btn btn-secondary btn-sm">
                          {s.status === 'upcoming' ? 'Bắt đầu' : 'Chi tiết'}
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
