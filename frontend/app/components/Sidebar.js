'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',            icon: '⬛', label: 'Dashboard' },
  { href: '/attendance',  icon: '📹', label: 'Điểm danh', badge: null },
  { href: '/students',    icon: '👥', label: 'Sinh viên' },
  { href: '/reports',     icon: '📊', label: 'Báo cáo' },
  { href: '/settings',    icon: '⚙️', label: 'Cài đặt' },
];

export default function Sidebar() {
  const pathname = usePathname();

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
        {NAV.map(({ href, icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname === href ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
            {badge && <span className="nav-badge">{badge}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">GV</div>
          <div className="user-info">
            <div className="user-name">Giáo viên</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
