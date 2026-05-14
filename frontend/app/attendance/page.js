'use client';
import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppShell from '../components/AppShell';
import { getTaskHumans } from '../lib/taskApi';
import { closeSession, recognizeFaces, connectSessionWs, getSessionReport } from '../lib/sessionApi';

const COLORS = ['#143A51','#C49A68','#1a4a66','#1A8F6F','#0B1F3A','#8a5c1e','#1e5a7a','#9a6b2a'];
const avatarColor = (id) => COLORS[id % COLORS.length];

/* ── Camera Feed + Canvas overlay ── */
function CameraFeed({ videoRef, canvasRef, isRunning, detectedFaces }) {
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
      .catch(() => {});
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [isRunning]);

  // Draw bounding boxes from AI response
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detectedFaces.forEach(f => {
      if (!f.bbox || f.bbox.length < 4) return;
      const [x1, y1, x2, y2] = f.bbox;
      ctx.strokeStyle = '#1A8F6F'; ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillStyle = 'rgba(26,143,111,0.15)';
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillStyle = '#C49A68'; ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`${f.name} ${Math.round(f.confidence * 100)}%`, x1 + 4, y1 - 6);
    });
  }, [detectedFaces]);

  return (
    <div style={{ position: 'relative', background: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/3' }}>
      <video ref={videoRef} muted playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {!isRunning && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--bg-elevated)', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: 48, opacity: 0.3 }}>📷</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Camera chưa được kích hoạt</div>
        </div>
      )}
      <canvas ref={canvasRef} width={640} height={480}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      {isRunning && (
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(11,31,58,0.75)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20,
          padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
        }}>
          <div className="status-dot live" />
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>LIVE</span>
        </div>
      )}
    </div>
  );
}

function AttendanceInner() {
  const params = useSearchParams();
  const router = useRouter();
  const taskId   = params.get('taskId');
  const sessionId = params.get('sessionId');

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const wsRef     = useRef(null);
  const intervalRef = useRef(null);

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionHumans, setSessionHumans] = useState([]);   // list from task
  const [presentIds, setPresentIds] = useState([]);          // attended human ids
  const [detectedFaces, setDetectedFaces] = useState([]);    // current frame bboxes
  const [log, setLog] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [error, setError] = useState('');
  const [unrecognized, setUnrecognized] = useState(0);

  // Missing taskId/sessionId — redirect to dashboard
  useEffect(() => {
    if (!taskId || !sessionId) router.replace('/');
  }, [taskId, sessionId]);

  // Load task humans + Current Attendance Status (Resume)
  useEffect(() => {
    if (!taskId || !sessionId) return;
    
    // 1. Tải danh sách gốc
    getTaskHumans(taskId)
      .then(data => {
        setTaskName(data.name);
        const people = (data.task_humans || []).map(th => th.human);
        setSessionHumans(people);
        
        // 2. Tải trạng thái hiện tại của phiên (nếu đang chạy dở)
        return getSessionReport(sessionId);
      })
      .then(report => {
        if (report && report.details) {
            const alreadyAttended = report.details
                .filter(d => d.attended)
                .map(d => d.human_id);
            setPresentIds(alreadyAttended);
            
            // Nếu phiên đang ACTIVE, tự động bật camera/nhận diện
            if (report.status === 'ACTIVE') {
                startSession();
            }
        }
      })
      .catch(err => setError(`Không tải được dữ liệu: ${err.message}`));
  }, [taskId, sessionId]);

  // Timer
  useEffect(() => {
    if (!sessionActive) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [sessionActive]);



  // Capture frame from webcam → Blob
  const captureFrame = useCallback(() => new Promise(resolve => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) { resolve(null); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(resolve, 'image/jpeg', 0.85);
  }), []);

  const startSession = useCallback(async () => {
    setSessionActive(true);
    setPresentIds([]);
    setLog([]);
    setElapsed(0);
    setUnrecognized(0);

    // Connect WebSocket for realtime events
    wsRef.current = connectSessionWs(sessionId, (data) => {
      if (data.event === 'human_recognized') {
        if (data.attended) {
          setPresentIds(prev => prev.includes(data.human_id) ? prev : [...prev, data.human_id]);
        }
        setLog(prev => [{
          human_id: data.human_id,
          name: data.name,
          confidence: data.confidence,
          hit_count: data.hit_count,
          attended: data.attended,
          time: new Date().toLocaleTimeString('vi-VN'),
          key: Date.now(),
        }, ...prev.slice(0, 49)]);
      }
    });

    // Start recognition interval
    intervalRef.current = setInterval(async () => {
      try {
        const blob = await captureFrame();
        if (!blob) return;
        const result = await recognizeFaces(sessionId, blob);
        if (result.recognized?.length > 0) {
          setDetectedFaces(result.recognized);
          setTimeout(() => setDetectedFaces([]), 2000);
        }
        setUnrecognized(result.unrecognized || 0);
      } catch (err) {
        console.warn('Recognize error:', err.message);
      }
    }, 1500);
  }, [sessionId, captureFrame]);

  const stopSession = useCallback(async () => {
    if (!window.confirm('🔔 Bạn có chắc chắn muốn kết thúc phiên điểm danh này? \n(Hành động này sẽ đóng phiên và không thể nhận diện thêm)')) return;
    
    clearInterval(intervalRef.current);
    wsRef.current?.close();
    setSessionActive(false);
    try { await closeSession(sessionId); } catch (_) {}
  }, [sessionId]);

  // Auto-stop when everyone reached 5 hits (attended === true)
  useEffect(() => {
    if (sessionActive && sessionHumans.length > 0 && presentIds.length === sessionHumans.length) {
      const timer = setTimeout(() => {
        stopSession();
        alert('🎉 Tuyệt vời! Tất cả sinh viên đã hoàn thành điểm danh (đủ 5 lần nhận diện). Phiên đã tự động đóng.');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [presentIds.length, sessionHumans.length, sessionActive, stopSession]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(intervalRef.current);
    wsRef.current?.close();
  }, []);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const pct = sessionHumans.length ? Math.round((presentIds.length / sessionHumans.length) * 100) : 0;

  const exportCSV = () => {
    const rows = sessionHumans.map(h => `${h.id},${h.name},${presentIds.includes(h.id) ? 'CÓ MẶT' : 'VẮNG'}`);
    const blob = new Blob([`ID,Họ tên,Trạng thái\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `diemdanh_${taskName}_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    a.click();
  };

  return (
    <AppShell
      title="Điểm danh trực tiếp"
      subtitle={taskName ? `Lớp học: ${taskName}` : 'Nhận diện khuôn mặt tự động qua camera'}
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
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {sessionHumans.length === 0 && !error && (
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--warning-bg)', borderLeft: '3px solid var(--warning)', fontSize: 13 }}>
          ⚠️ Lớp học này chưa có sinh viên. Vào <strong>Sinh viên</strong> để thêm người, sau đó vào Dashboard &gt; Lớp học &gt; Quản lý người.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* LEFT: camera */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CameraFeed videoRef={videoRef} canvasRef={canvasRef} isRunning={sessionActive} detectedFaces={detectedFaces} />

          {/* Timer + progress */}
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
                    Đã điểm danh <strong>{presentIds.length}</strong>/{sessionHumans.length}
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
              {unrecognized > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>KHÔNG XĐ</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>{unrecognized}</div>
                </div>
              )}
            </div>
          </div>

          {/* Session info */}
          <div className="card" style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16 }}>
            <span>📋 Session ID: <strong>{sessionId}</strong></span>
            <span>🎯 Lớp học: <strong>{taskName || taskId}</strong></span>
            <span style={{ color: sessionActive ? 'var(--success)' : 'var(--text-muted)' }}>
              {sessionActive ? '🟢 Đang chạy' : '⚪ Dừng'}
            </span>
          </div>
        </div>

        {/* RIGHT: people list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Detection log */}
          {log.length > 0 && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                📋 Nhật ký nhận diện
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {log.slice(0, 8).map(entry => (
                  <div key={entry.key} className="animate-in" style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                    borderRadius: 8, background: 'var(--bg-elevated)',
                  }}>
                    <div className="status-dot" style={{ background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy-dark)' }}>{entry.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                          <span>{entry.time}</span>
                          <span>•</span>
                          <span style={{ color: entry.attended ? 'var(--success)' : 'var(--gold)', fontWeight: 600 }}>
                             {entry.hit_count}/5 lượt {entry.attended && '✅'}
                          </span>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* People list */}
          <div className="card" style={{ padding: '14px 0' }}>
            <div style={{ padding: '0 16px 12px', fontSize: 13, fontWeight: 700 }}>
              Danh sách — {taskName}
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>({sessionHumans.length} người)</span>
            </div>
            {sessionHumans.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Chưa có người trong task này
              </div>
            ) : (
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {sessionHumans.map(h => {
                  const present = presentIds.includes(h.id);
                  return (
                    <div key={h.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 16px', borderBottom: '1px solid var(--border)',
                      background: present ? 'rgba(26,143,111,0.06)' : 'transparent',
                      transition: 'background 0.4s',
                    }}>
                      <div className="avatar avatar-sm" style={{ background: present ? avatarColor(h.id) : 'var(--bg-hover)', color: 'white' }}>
                        {h.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: present ? 600 : 400, color: present ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {h.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{h.id}</div>
                      </div>
                      {present
                        ? <span className="badge badge-success">✓ Có mặt</span>
                        : <span className="badge badge-muted">Chưa</span>
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>}>
      <AttendanceInner />
    </Suspense>
  );
}
