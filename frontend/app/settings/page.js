'use client';
import { useState } from 'react';
import AppShell from '../components/AppShell';

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '4px 0' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--primary)' : 'var(--bg-hover)',
        position: 'relative', transition: 'background 0.2s',
        border: '1px solid var(--border-bright)',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 2, left: value ? 22 : 2,
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const [threshold, setThreshold] = useState(45);
  const [frameInterval, setFrameInterval] = useState(1500);
  const [autoStop, setAutoStop] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell
      title="Cài đặt hệ thống"
      subtitle="Cấu hình AI, camera và thông báo"
      actions={
        <button className="btn btn-primary" onClick={save}>
          {saved ? '✅ Đã lưu!' : '💾 Lưu thay đổi'}
        </button>
      }
    >
      <div style={{ maxWidth: 720 }}>
        {/* ── AI Settings ── */}
        <Section title="🤖 Cài đặt AI nhận diện">
          <SettingRow
            label="Ngưỡng nhận diện (Similarity Threshold)"
            desc={`Giá trị hiện tại: ${threshold / 100} — Cao hơn = chặt hơn, ít nhầm lẫn hơn`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range" min={30} max={70} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: 140, accentColor: 'var(--primary)' }}
              />
              <div style={{
                width: 52, textAlign: 'center', fontWeight: 700, fontSize: 15,
                color: threshold >= 50 ? 'var(--success)' : threshold >= 40 ? 'var(--warning)' : 'var(--danger)',
              }}>
                {threshold / 100}
              </div>
            </div>
          </SettingRow>
          <hr className="divider" />
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            {[['< 0.40', 'Dễ nhận', 'danger'],['0.40–0.50', 'Cân bằng ⭐', 'warning'],['≥ 0.50', 'Chặt', 'success']].map(([r, l, c]) => (
              <div key={r} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: `1px solid var(--${c === 'danger' ? 'danger' : c === 'warning' ? 'warning' : 'success'})`, opacity: 0.7 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{r}</div>
                <div>{l}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Camera ── */}
        <Section title="📷 Cài đặt Camera">
          <SettingRow
            label="Chu kỳ trích xuất frame"
            desc={`Gửi 1 frame mỗi ${frameInterval}ms đến AI server`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range" min={500} max={5000} step={500} value={frameInterval}
                onChange={e => setFrameInterval(Number(e.target.value))}
                style={{ width: 140, accentColor: 'var(--primary)' }}
              />
              <div style={{ width: 60, textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                {frameInterval >= 1000 ? `${frameInterval/1000}s` : `${frameInterval}ms`}
              </div>
            </div>
          </SettingRow>
          <hr className="divider" />
          <SettingRow label="Kiểm tra độ mờ frame (Blur Filter)" desc="Bỏ qua frame bị mờ để tăng độ chính xác">
            <Toggle value={true} onChange={() => {}} />
          </SettingRow>
          <hr className="divider" />
          <SettingRow label="Adaptive sampling" desc="Tự động giảm tần suất khi đã điểm danh đủ sinh viên">
            <Toggle value={autoStop} onChange={setAutoStop} />
          </SettingRow>
          <hr className="divider" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Kiểm tra camera</div>
            <button className="btn btn-secondary">🎥 Test camera ngay</button>
          </div>
        </Section>

        {/* ── Classes ── */}
        <Section title="🎓 Quản lý lớp học">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Lớp</th><th>Số sinh viên</th><th>Giáo viên</th><th></th></tr>
              </thead>
              <tbody>
                {[
                  { cls: 'CNTT-K22A', count: 35, teacher: 'Nguyễn Văn X' },
                  { cls: 'CNTT-K22B', count: 33, teacher: 'Trần Thị Y'  },
                  { cls: 'CNTT-K23A', count: 38, teacher: 'Lê Văn Z'    },
                ].map(c => (
                  <tr key={c.cls}>
                    <td><span className="badge badge-primary">{c.cls}</span></td>
                    <td>{c.count} sinh viên</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.teacher}</td>
                    <td><button className="btn btn-ghost btn-sm">Sửa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: 'fit-content' }}>➕ Thêm lớp</button>
        </Section>

        {/* ── Notifications ── */}
        <Section title="🔔 Thông báo">
          <SettingRow label="Cảnh báo vắng nhiều buổi" desc="Thông báo khi SV vắng liên tiếp ≥ 3 buổi">
            <Toggle value={notifications} onChange={setNotifications} />
          </SettingRow>
          <hr className="divider" />
          <SettingRow label="Báo cáo tự động" desc="Tự động gửi báo cáo tuần vào thứ Hai">
            <Toggle value={false} onChange={() => {}} />
          </SettingRow>
          <hr className="divider" />
          <SettingRow label="Ngưỡng cảnh báo vắng" desc="Số buổi vắng tối đa trước khi cảnh báo">
            <select className="form-input form-select" style={{ width: 80 }}>
              <option>2</option><option>3</option><option>4</option><option>5</option>
            </select>
          </SettingRow>
        </Section>

        {/* ── API info ── */}
        <Section title="🔌 Kết nối API">
          <SettingRow label="AI Server URL" desc="Địa chỉ FastAPI inference server">
            <input className="form-input" defaultValue="http://localhost:8000" style={{ width: 240, fontSize: 12 }} />
          </SettingRow>
          <hr className="divider" />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm">🔍 Kiểm tra kết nối</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)' }}>
              <div className="status-dot live" /> AI Server: Online
            </div>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
