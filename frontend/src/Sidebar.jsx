import React from 'react';

const Icon = ({ path, className = '' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const paths = {
  home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  dashboard: <><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></>,
  heatmap: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></>,
  forecast: <><path d="M2 12h4l3-9 5 18 3-9h5"></path></>,
  alerts: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  settings: <><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  login: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
};

export default function Sidebar({ onNavigate, onLogout, user, currentView }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="icon-badge"><Icon path={<path d="M2 12A10 10 0 1 0 22 12" />} /></div>
        <div>
          <h3>Air Intelligence</h3>
          <p>The Ethereal Observer</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li><a href="#" onClick={() => onNavigate('landing')}><Icon path={paths.home} /> Home</a></li>
          <li><a href="#" className={currentView === 'dashboard' ? 'active' : ''} onClick={() => onNavigate('dashboard')}><Icon path={paths.dashboard} /> Dashboard</a></li>
          <li><a href="#" className={currentView === 'heatmap' ? 'active' : ''} onClick={() => onNavigate('heatmap')}><Icon path={paths.heatmap} /> Heatmap</a></li>
          <li><a href="#" className={currentView === 'forecast' ? 'active' : ''} onClick={() => onNavigate('forecast')}><Icon path={paths.forecast} /> Forecast</a></li>
          <li><a href="#" className={currentView === 'alerts' ? 'active' : ''} onClick={() => onNavigate('alerts')}><Icon path={paths.alerts} /> Alerts</a></li>
        </ul>
      </nav>

      <nav className="sidebar-footer-nav">
        <ul>
          <li><a href="#" className={currentView === 'settings' ? 'active' : ''} onClick={() => onNavigate('settings')}><Icon path={paths.settings} /> Settings</a></li>
        </ul>
      </nav>

      <div className="user-sidebar-info">
        {user ? (
          <>
            <div className="user-details">
              <div className="user-avatar">{user.name?.[0] || 'O'}</div>
              <div className="user-meta">
                <span className="user-name">{user.name}</span>
                <span className="user-role">Observer</span>
              </div>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Logout">
              <Icon path={paths.logout} />
            </button>
          </>
        ) : (
          <>
            <div className="user-details">
              <div className="user-avatar" style={{background: '#94a3b8'}}>?</div>
              <div className="user-meta">
                <span className="user-name">Guest Observer</span>
                <span className="user-role">Limited View</span>
              </div>
            </div>
            <button className="logout-btn" onClick={() => onNavigate('login')} title="Login">
              <Icon path={paths.login} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
