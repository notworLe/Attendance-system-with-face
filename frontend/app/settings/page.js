'use client';
import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import { getCurrentUser } from '../lib/auth';
import { patch, get } from '../lib/api';

// ─── Components ───────────────────────────────────────────────────────────────
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

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--primary)' : 'var(--bg-hover)',
        position: 'relative', transition: 'background 0.2s',
        border: '1px solid var(--border-bright)',
        opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer'
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  // ── User profile ─────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // ── Change password ──────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState(null); // { ok, msg }
  const [pwLoading, setPwLoading] = useState(false);

  // ── API connection ───────────────────────────────────────────
  const [apiStatus, setApiStatus] = useState(null); // null | 'checking' | 'ok' | 'error'
  const [apiMsg, setApiMsg] = useState('');

  // ── Preferences (local storage) ─────────────────────────────
  const [frameInterval, setFrameInterval] = useState(1500);
  const [blurFilter, setBlurFilter] = useState(true);
  const [adaptiveSampling, setAdaptiveSampling] = useState(true);
  const [prefSaved, setPrefSaved] = useState(false);

  // Load user info
  useEffect(() => {
    getCurrentUser()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('app_preferences') || '{}');
      if (saved.frameInterval) setFrameInterval(saved.frameInterval);
      if (saved.blurFilter !== undefined) setBlurFilter(saved.blurFilter);
      if (saved.adaptiveSampling !== undefined) setAdaptiveSampling(saved.adaptiveSampling);
    } catch (_) {}
  }, []);

  // ── Change password ──────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.next.trim()) { setPwStatus({ ok: false, msg: 'Mật khẩu mới không được để trống' }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwStatus({ ok: false, msg: 'Xác nhận mật khẩu không khớp' }); return; }
    if (pwForm.next.length < 8) { setPwStatus({ ok: false, msg: 'Mật khẩu tối thiểu 8 ký tự' }); return; }

    setPwLoading(true); setPwStatus(null);
    try {
      // fastapi-users: PATCH /users/me
      await patch('/users/me', { password: pwForm.next });
      setPwStatus({ ok: true, msg: '✅ Đổi mật khẩu thành công!' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e) {
      setPwStatus({ ok: false, msg: e.message || 'Lỗi khi đổi mật khẩu' });
    } finally {
      setPwLoading(false);
    }
  };

  // ── Check API connection ──────────────────────────────────────
  const checkApiConnection = async () => {
    setApiStatus('checking'); setApiMsg('');
    try {
      const start = Date.now();
      await get('/');
      const ms = Date.now() - start;
      setApiStatus('ok');
      setApiMsg(`Phản hồi trong ${ms}ms`);
    } catch (e) {
      setApiStatus('error');
      setApiMsg(e.message || 'Không kết nối được');
    }
  };

  // ── Save preferences ──────────────────────────────────────────
  const savePreferences = () => {
    localStorage.setItem('app_preferences', JSON.stringify({ frameInterval, blurFilter, adaptiveSampling }));
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2500);
  };

  return (
    <AppShell
      title="Cài đặt hệ thống"
      subtitle="Cấu hình AI, camera và tài khoản"
    >
      <div style={{ maxWidth: 720 }}>

        {/* ── Tài khoản ── */}
        <Section title="👤 Thông tin tài khoản">
          {userLoading ? (
            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
            </div>
          ) : user ? (
            <>
              <SettingRow label="Email" desc="Địa chỉ email đăng nhập">
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  {user.email}
                </div>
              </SettingRow>
              <hr className="divider" />
              <SettingRow label="Trạng thái tài khoản" desc="">
                <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {user.is_active ? '● Đang hoạt động' : '○ Bị khóa'}
                </span>
              </SettingRow>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Không thể tải thông tin tài khoản</div>
          )}
        </Section>

        {/* ── Đổi mật khẩu ── */}
        <Section title="🔐 Đổi mật khẩu">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Mật khẩu mới</label>
              <input
                type="password"
                className="form-input"
                placeholder="Tối thiểu 8 ký tự"
                value={pwForm.next}
                onChange={e => { setPwForm(f => ({ ...f, next: e.target.value })); setPwStatus(null); }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className="form-input"
                placeholder="Nhập lại mật khẩu mới"
                value={pwForm.confirm}
                onChange={e => { setPwForm(f => ({ ...f, confirm: e.target.value })); setPwStatus(null); }}
              />
            </div>
            {pwStatus && (
              <div style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, background: pwStatus.ok ? 'rgba(26,143,111,0.1)' : 'rgba(220,53,69,0.1)', color: pwStatus.ok ? 'var(--success)' : 'var(--danger)', border: `1px solid ${pwStatus.ok ? 'var(--success)' : 'var(--danger)'}` }}>
                {pwStatus.msg}
              </div>
            )}
            <div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleChangePassword}
                disabled={pwLoading || !pwForm.next || !pwForm.confirm}
              >
                {pwLoading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Đang lưu...</> : '🔐 Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Camera ── */}
        <Section title="📷 Cài đặt Camera (lưu tại trình duyệt)">
          <SettingRow
            label="Chu kỳ trích xuất frame"
            desc={`Gửi 1 frame mỗi ${frameInterval >= 1000 ? `${frameInterval/1000}s` : `${frameInterval}ms`} đến AI server`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range" min={500} max={5000} step={500} value={frameInterval}
                onChange={e => setFrameInterval(Number(e.target.value))}
                style={{ width: 140, accentColor: 'var(--primary)' }}
              />
              <div style={{ width: 40, textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                {frameInterval >= 1000 ? `${frameInterval/1000}s` : `${frameInterval}ms`}
              </div>
            </div>
          </SettingRow>
          <hr className="divider" />
          <SettingRow label="Kiểm tra độ mờ frame (Blur Filter)" desc="Bỏ qua frame bị mờ để tăng độ chính xác">
            <Toggle value={blurFilter} onChange={setBlurFilter} />
          </SettingRow>
          <hr className="divider" />
          <SettingRow label="Adaptive sampling" desc="Tự động giảm tần suất khi đã điểm danh đủ sinh viên">
            <Toggle value={adaptiveSampling} onChange={setAdaptiveSampling} />
          </SettingRow>
          <hr className="divider" />
          <div>
            <button className="btn btn-secondary btn-sm" onClick={savePreferences}>
              {prefSaved ? '✅ Đã lưu!' : '💾 Lưu cài đặt camera'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Cài đặt được lưu trong trình duyệt, áp dụng khi điểm danh.
            </div>
          </div>
        </Section>

        {/* ── API connection ── */}
        <Section title="🔌 Kết nối API">
          <SettingRow label="AI Server URL" desc="Địa chỉ FastAPI inference server (cấu hình qua NEXT_PUBLIC_AI_URL)">
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'monospace' }}>
              {process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000'}
            </div>
          </SettingRow>
          <hr className="divider" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={checkApiConnection}
              disabled={apiStatus === 'checking'}
            >
              {apiStatus === 'checking'
                ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Đang kiểm tra...</>
                : '🔍 Kiểm tra kết nối'}
            </button>
            {apiStatus === 'ok' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--success)' }}>
                <div className="status-dot live" /> AI Server: Online — {apiMsg}
              </div>
            )}
            {apiStatus === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--danger)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} /> Lỗi: {apiMsg}
              </div>
            )}
          </div>
        </Section>

      </div>
    </AppShell>
  );
}
