'use client';
import Sidebar from './Sidebar';

export default function AppShell({ children, title, subtitle, actions }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </header>
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
}
