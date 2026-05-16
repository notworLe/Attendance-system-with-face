'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { logout } from '../lib/auth';

const ADMIN_NAV = [
  { href: '/',           icon: '⬛', label: 'Dashboard' },
  { href: '/students',   icon: '👥', label: 'Sinh viên' },
  { href: '/reports',    icon: '📊', label: 'Báo cáo' },
  { href: '/settings',   icon: '⚙️', label: 'Cài đặt' },
];

const TEACHER_NAV = [
  { href: '/',           icon: '⬛', label: 'Dashboard' },
  { href: '/attendance', icon: '📹', label: 'Điểm danh' },
  { href: '/reports',    icon: '📊', label: 'Báo cáo' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'GV';
  const displayName = user?.email || 'Giáo viên';
  const roleDisplay = role === 'admin' ? 'Quản trị viên' : 'Giảng viên';

  const NAV = role === 'admin' ? ADMIN_NAV : TEACHER_NAV;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">👁️</div>
        <div className="logo-text">
          FaceAttend
          <span>AI Attendance System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Menu chính</div>
        {!loading && NAV.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname === href ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={handleLogout} title="Đăng xuất">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div className="user-role">{!loading ? roleDisplay : '...'} - Đăng xuất</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
