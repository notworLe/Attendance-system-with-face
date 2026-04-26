'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '../components/AppShell';

/* ── mock students in class ── */
const CLASS_STUDENTS = [
  { id: 'SV001', name: 'Nguyễn Văn An',    avatar: 'NA' },
  { id: 'SV002', name: 'Trần Thị Bình',    avatar: 'TB' },
  { id: 'SV003', name: 'Lê Hoàng Cường',   avatar: 'LC' },
  { id: 'SV004', name: 'Phạm Thị Dung',    avatar: 'PD' },
  { id: 'SV005', name: 'Vũ Minh Đức',      avatar: 'VĐ' },
  { id: 'SV006', name: 'Hoàng Thị Giang',  avatar: 'HG' },
  { id: 'SV007', name: 'Đặng Văn Hải',     avatar: 'ĐH' },
  { id: 'SV008', name: 'Bùi Thị Hoa',      avatar: 'BH' },
  { id: 'SV009', name: 'Ngô Quốc Hùng',    avatar: 'NH' },
  { id: 'SV010', name: 'Đinh Thị Lan',     avatar: 'DL' },
  { id: 'SV011', name: 'Lý Văn Long',      avatar: 'LL' },
  { id: 'SV012', name: 'Phan Thị Mai',     avatar: 'PM' },
];

const COLORS = ['#143A51','#C49A68','#1a4a66','#1A8F6F','#0B1F3A','#8a5c1e','#1e5a7a','#9a6b2a'];
const avatarColor = (id) => COLORS[parseInt(id.replace('SV','')) % COLORS.length];

/* ── simulate face detection result ── */
function simulateDetection(presentIds) {
  if (presentIds.length >= CLASS_STUDENTS.length) return null;
  const remaining = CLASS_STUDENTS.filter(s => !presentIds.includes(s.id));
  if (!remaining.length) return null;
  const pick = remaining[Math.floor(Math.random() * remaining.length)];
  return { student_id: pick.id, name: pick.name, confidence: 0.82 + Math.random() * 0.15 };
}

function CameraFeed({ isRunning, detectedFaces, onFrame }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }
    navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480 } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      })
      .catch(() => { /* camera not available — demo mode */ });
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [isRunning]);

  /* draw overlay boxes on canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detectedFaces.forEach((f, i) => {
      const x = 80 + i * 140, y = 80, w = 100, h = 130;
      ctx.strokeStyle = '#143A51';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(20,58,81,0.12)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#C49A68';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(f.name.split(' ').pop(), x, y - 6);
      ctx.fillText(`${Math.round(f.confidence * 100)}%`, x + w - 32, y - 6);
    });
  }, [detectedFaces]);

  return (
    <div style={{ position: 'relative', background: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/3' }}>
      <video
        ref={videoRef}
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: isRunning ? 'block' : 'none' }}
      />
      {/* demo bg when no camera */}
      {isRunning && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #EDF1F5, #F2F5F7)',
          flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: 48 }}>📷</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Camera đang hoạt động (Demo Mode)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
            <div className="status-dot live" />
            Đang quét khuôn mặt...
          </div>
        </div>
      )}
      {!isRunning && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-elevated)', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: 48, opacity: 0.3 }}>📷</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Camera chưa được kích hoạt</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={640} height={480}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      {/* live badge */}
      {isRunning && (
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(11,31,58,0.75)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20, padding: '4px 10px',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
        }}>
          <div className="status-dot live" />
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>LIVE</span>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [presentIds, setPresentIds] = useState([]);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [log, setLog] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [selectedClass, setSelectedClass] = useState('CNTT-K22A');
  const [selectedSubject, setSelectedSubject] = useState('Lập trình Web');
  const [manualId, setManualId] = useState('');

  /* timer */
  useEffect(() => {
    if (!sessionActive) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [sessionActive]);

  /* simulate AI detection every 1.5s */
  useEffect(() => {
    if (!sessionActive) return;
    const id = setInterval(() => {
      const result = simulateDetection(presentIds);
      if (!result) return;
      setPresentIds(prev => {
        if (prev.includes(result.student_id)) return prev;
        setLog(l => [{
          ...result,
          time: new Date().toLocaleTimeString('vi-VN'),
          key: Date.now(),
        }, ...l.slice(0, 49)]);
        setDetectedFaces([result]);
        setTimeout(() => setDetectedFaces([]), 1500);
        return [...prev, result.student_id];
      });
    }, 1500);
    return () => clearInterval(id);
  }, [sessionActive, presentIds]);

  const startSession = () => {
    setPresentIds([]);
    setLog([]);
    setElapsed(0);
    setDetectedFaces([]);
    setSessionActive(true);
  };

  const stopSession = () => setSessionActive(false);

  const markManual = () => {
    const s = CLASS_STUDENTS.find(x => x.id === manualId || x.name.toLowerCase().includes(manualId.toLowerCase()));
    if (!s || presentIds.includes(s.id)) return;
    setPresentIds(p => [...p, s.id]);
    setLog(l => [{ student_id: s.id, name: s.name, confidence: 1, time: new Date().toLocaleTimeString('vi-VN'), manual: true, key: Date.now() }, ...l]);
    setManualId('');
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const pct = Math.round((presentIds.length / CLASS_STUDENTS.length) * 100);

  const exportCSV = () => {
    const rows = CLASS_STUDENTS.map(s => `${s.id},${s.name},${presentIds.includes(s.id) ? 'CÓ MẶT' : 'VẮNG'}`);
    const blob = new Blob([`Mã SV,Họ tên,Trạng thái\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `diemdanh_${selectedClass}_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    a.click();
  };

  return (
    <AppShell
      title="Điểm danh trực tiếp"
      subtitle="Nhận diện khuôn mặt tự động qua camera"
      actions={
        <>
          {!sessionActive ? (
            <button className="btn btn-success" onClick={startSession}>▶ Bắt đầu phiên</button>
          ) : (
            <button className="btn btn-danger" onClick={stopSession}>⏹ Dừng phiên</button>
          )}
          {!sessionActive && presentIds.length > 0 && (
            <button className="btn btn-secondary" onClick={exportCSV}>📥 Xuất CSV</button>
          )}
        </>
      }
    >
      {/* ── Config bar ── */}
      {!sessionActive && (
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label">Lớp học</label>
            <select className="form-input form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option>CNTT-K22A</option><option>CNTT-K22B</option><option>CNTT-K23A</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Môn học</label>
            <select className="form-input form-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option>Lập trình Web</option><option>Cơ sở dữ liệu</option><option>Mạng máy tính</option>
            </select>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', paddingBottom: 8 }}>
            {CLASS_STUDENTS.length} sinh viên trong lớp
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* ── LEFT: camera ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CameraFeed isRunning={sessionActive} detectedFaces={detectedFaces} />

          {/* timer + progress */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>THỜI GIAN</div>
                <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: sessionActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {fmt(elapsed)}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Đã điểm danh <strong>{presentIds.length}</strong>/{CLASS_STUDENTS.length}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 80 ? 'var(--success)' : 'var(--warning)' }}>{pct}%</span>
                </div>
                <div className="progress-wrap" style={{ height: 10 }}>
                  <div className="progress-bar" style={{
                    width: `${pct}%`, height: 10,
                    background: pct >= 80 ? 'linear-gradient(90deg,var(--success),#1A8F6F)' : 'linear-gradient(90deg,var(--gold),var(--primary))',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* manual override */}
          {sessionActive && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✍️ Điểm danh thủ công</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Nhập tên hoặc mã sinh viên..."
                  value={manualId}
                  onChange={e => setManualId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && markManual()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={markManual}>Điểm danh</button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: student list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* detection log */}
          {log.length > 0 && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                📋 Nhật ký nhận diện
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {log.slice(0, 8).map((l) => (
                  <div key={l.key} className="animate-in" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 8,
                    background: 'var(--bg-elevated)',
                  }}>
                    <div className="status-dot" style={{ background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
                    <span style={{ fontSize: 12, flex: 1, fontWeight: 500 }}>{l.name}</span>
                    {l.manual && <span style={{ fontSize: 10, color: 'var(--warning)' }}>✍️</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* full student list */}
          <div className="card" style={{ padding: '14px 0' }}>
            <div style={{ padding: '0 16px 12px', fontSize: 13, fontWeight: 700 }}>
              Danh sách lớp {selectedClass}
            </div>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {CLASS_STUDENTS.map((s) => {
                const present = presentIds.includes(s.id);
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: present ? 'rgba(16,185,129,0.05)' : 'transparent',
                    transition: 'background 0.3s',
                  }}>
                    <div className="avatar avatar-sm" style={{ background: present ? avatarColor(s.id) : 'var(--bg-hover)', color: 'white' }}>
                      {s.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: present ? 600 : 400, color: present ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.id}</div>
                    </div>
                    {present
                      ? <span className="badge badge-success">✓ Có mặt</span>
                      : <span className="badge badge-muted">Chưa</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
