import React, { useState, useEffect } from 'react';
import './Alerts.css';
import { ML_API_BASE_URL } from './config';

const Icon = ({ path, className = '' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const paths = {
  home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  dashboard: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
  heatmap: <path d="M12 20V10M18 20V4M6 20v-4" />,
  forecast: <path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7" />,
  alerts: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  settings: <circle cx="12" cy="12" r="3" />,
  support: <circle cx="12" cy="12" r="10" />,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
  smartphone: <><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  login: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
};

export default function Alerts({ onNavigate, onLogout, locationQuery, user }) {
  const [threshold, setThreshold] = useState(100);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const query = locationQuery || 'Central Park, NY';
        const res = await fetch(`${ML_API_BASE_URL}/api/aqi?location=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.status === 'success') {
          if (active) setApiData(json);
        } else {
          if (active) setError(json.message);
        }
      } catch (err) {
        if (active) setError('Notification center offline.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [locationQuery]);

  if (loading) return <div className="alerts-layout"><div style={{margin:'auto', padding:'5rem', color:'#0d47a1', fontSize:'1.5rem', fontWeight:'bold'}}>Scanning Global Grids...</div></div>;
  if (error) return <div className="alerts-layout"><div style={{margin:'auto', padding:'5rem', color:'red'}}>{error}</div></div>;

  const alerts = apiData?.alerts || [];
  const locationName = apiData?.data?.location_name || locationQuery;

  return (
    <div className="alerts-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="icon-badge"><Icon path={<path d="M2 12A10 10 0 1 0 22 12" />} /></div>
          <div>
            <h3>Aura Intelligence</h3>
            <p>The Ethereal Observer</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li><a href="#" onClick={() => onNavigate && onNavigate('landing')}><Icon path={paths.home} /> Home</a></li>
            <li><a href="#" onClick={() => onNavigate && onNavigate('dashboard')}><Icon path={paths.dashboard} /> Dashboard</a></li>
            <li><a href="#" onClick={() => onNavigate && onNavigate('heatmap')}><Icon path={paths.heatmap} /> Heatmap</a></li>
            <li><a href="#" onClick={() => onNavigate && onNavigate('forecast')}><Icon path={paths.forecast} /> Forecast</a></li>
            <li><a href="#" className="active" onClick={() => onNavigate && onNavigate('alerts')}><Icon path={paths.alerts} /> Alerts</a></li>
          </ul>
        </nav>



        <nav className="sidebar-footer-nav">
          <ul>
            <li><a href="#"><Icon path={paths.settings} /> Settings</a></li>
            <li><a href="#"><Icon path={paths.support} /> Support</a></li>
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

      {/* Main Content */}
      <main className="dashboard-main alerts-main">
        <header className="dashboard-header animate-fade-in">
          <div>
            <div className="location-context">
              <Icon path={<circle cx="12" cy="10" r="3" />} className="icon-sm text-primary" /> NOTIFICATION CENTER
            </div>
            <h1>Active Alerts</h1>
            <p className="subtitle">Real-time environmental health warnings for {locationName}</p>
          </div>
        </header>

        <div className="alerts-grid animate-fade-in delay-100">
          
          <div className="alerts-feed">
            <h3 className="section-heading">Current Warnings</h3>
            
            {alerts.length === 0 ? (
              <div className="alert-card info">
                <div className="alert-icon-wrapper"><Icon path={paths.info} /></div>
                <div className="alert-content">
                  <h4>No Active Warnings</h4>
                  <p>Air quality in {locationName} is currently within safe ML projections. No immediate action required.</p>
                </div>
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div key={idx} className={`alert-card ${alert.severity === 'CRITICAL' ? 'critical' : 'warning'}`}>
                  <div className="alert-icon-wrapper">
                    <Icon path={paths.warning} />
                  </div>
                  <div className="alert-content">
                    <div className="ac-header">
                      <h4>{alert.title}</h4>
                      <span className="ac-time">Just Now</span>
                    </div>
                    <p>{alert.message}</p>
                    <div className="ac-tags">
                      <span className="ac-tag">{locationName}</span>
                      <span className={`ac-tag ${alert.severity === 'CRITICAL' ? 'danger' : 'caution'}`}>
                        {alert.severity === 'CRITICAL' ? 'Action Required' : 'Monitoring'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="alert-card info">
              <div className="alert-icon-wrapper">
                <Icon path={paths.info} />
              </div>
              <div className="alert-content">
                <div className="ac-header">
                  <h4>System Health</h4>
                  <span className="ac-time">Live</span>
                </div>
                <p>Neural sensors for {locationName} are currently synchronized. Predictive accuracy: 94.2%.</p>
              </div>
            </div>

            {!user && (
              <div className="alert-card warning">
                <div className="alert-icon-wrapper"><Icon path={paths.warning} /></div>
                <div className="alert-content">
                  <h4>Login Required for Personalized Alerts</h4>
                  <p>Please sign in to receive real-time, predictive warnings tailored to {locationName}.</p>
                  <button className="btn btn-primary btn-sm mt-2" onClick={() => onNavigate('login')}>Login Now</button>
                </div>
              </div>
            )}
          </div>

          <div className={`alerts-config ${!user ? 'locked-config' : ''}`}>
            {!user && <div className="lock-overlay"><div className="lock-icon">🔒</div><span>Login to Configure Alerts</span></div>}
            <div className="card config-card">
              <h3>Notification Rules</h3>
              <p className="config-desc">Personalize when Aura should notify you.</p>

              <div className="config-group">
                <label>AQI Threshold Warning</label>
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="50" max="300" step="10" 
                    value={threshold} 
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="threshold-slider" 
                  />
                  <div className="threshold-value">Alert me at AQI {threshold}+</div>
                </div>
              </div>

              <div className="config-group mt-xl">
                <label>Delivery Channels</label>
                <label className="toggle-row">
                  <div className="tr-info">
                    <Icon path={paths.smartphone} />
                    <div>
                      <strong>Push Notifications</strong>
                      <span>Instant immediate alerts to device</span>
                    </div>
                  </div>
                  <div className="toggle active"></div>
                </label>
                <label className="toggle-row">
                  <div className="tr-info">
                    <Icon path={paths.mail} />
                    <div>
                      <strong>Email Summary</strong>
                      <span>Daily morning air quality digest</span>
                    </div>
                  </div>
                  <div className="toggle active"></div>
                </label>
              </div>

              <button className="btn btn-primary w-full mt-xl">Save Preferences</button>
            </div>
            
            <div className="card quiet-hours-card">
              <h3>Quiet Hours</h3>
              <p>Mute non-critical alerts</p>
              <div className="time-selects">
                <div className="form-group">
                  <span className="text-xs text-slate-500 font-semibold uppercase mb-1">From</span>
                  <select defaultValue="22:00">
                    <option value="21:00">9:00 PM</option>
                    <option value="22:00">10:00 PM</option>
                    <option value="23:00">11:00 PM</option>
                  </select>
                </div>
                <div className="form-group">
                  <span className="text-xs text-slate-500 font-semibold uppercase mb-1">To</span>
                  <select defaultValue="07:00">
                    <option value="06:00">6:00 AM</option>
                    <option value="07:00">7:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
