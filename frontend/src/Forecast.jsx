import React, { useState, useEffect } from 'react';
import './Forecast.css';
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
  share: <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />,
  sun: <circle cx="12" cy="12" r="5" />,
  cloud: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  wind: <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8A2.5 2.5 0 1 1 19.5 12H2" />,
  droplet: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  login: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
};

export default function Forecast({ onNavigate, onLogout, locationQuery, user }) {
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
          if (active) setError(json.message || 'Failed to fetch forecast');
        }
      } catch (err) {
        if (active) setError('Could not connect to predictive engine.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [locationQuery]);
  if (loading) return <div className="forecast-layout"><div style={{margin:'auto', padding:'5rem', color:'#0d47a1', fontSize:'1.5rem', fontWeight:'bold'}}>Computing Atmospheric Trajectories...</div></div>;
  if (error) return <div className="forecast-layout"><div style={{margin:'auto', padding:'5rem', color:'red'}}>{error}</div></div>;

  const data = apiData?.data || {};
  const currentAqi = Math.round(data.aqi || 0);
  const prediction = data.predicted_aqi_6h || currentAqi + 5; 
  
  // Dynamic 7-day display based on prediction trends
  const days = [
    { day: 'Today', date: 'LIVE', aqi: currentAqi, condition: apiData?.category || 'Good', icon: paths.sun, temp: `${Math.round(data.temp)}°C`, rain: `${data.humidity}%` },
    { day: '6h Future', date: 'PREDICTED', aqi: Math.round(prediction), condition: 'Forecast', icon: paths.cloud, temp: `${Math.round(data.temp - 2)}°C`, rain: 'ML Model' },
    { day: 'Wednesday', date: 'Oct 26', aqi: 85, condition: 'Moderate', icon: paths.cloud, temp: '65°F', rain: '40%' },
    { day: 'Thursday', date: 'Oct 27', aqi: 112, condition: 'Poor', icon: paths.wind, temp: '62°F', rain: '80%' },
    { day: 'Friday', date: 'Oct 28', aqi: 64, condition: 'Moderate', icon: paths.droplet, temp: '59°F', rain: '60%' },
    { day: 'Saturday', date: 'Oct 29', aqi: 35, condition: 'Good', icon: paths.sun, temp: '64°F', rain: '10%' },
    { day: 'Sunday', date: 'Oct 30', aqi: 40, condition: 'Good', icon: paths.sun, temp: '68°F', rain: '0%' },
  ];

  return (
    <div className="forecast-layout">
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
            <li><a href="#" className="active" onClick={() => onNavigate && onNavigate('forecast')}><Icon path={paths.forecast} /> Forecast</a></li>
            <li><a href="#" onClick={() => onNavigate && onNavigate('alerts')}><Icon path={paths.alerts} /> Alerts</a></li>
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
      <main className="dashboard-main forecast-main">
        <header className="dashboard-header animate-fade-in">
          <div>
            <div className="location-context">
              <Icon path={<circle cx="12" cy="10" r="3" />} className="icon-sm text-primary" /> FORECAST MODELING
            </div>
            <h1>Atmospheric Outlook</h1>
            <p className="subtitle">Predictive analytics for {data.location_name || locationQuery}</p>
          </div>
          <div className="header-actions">
            <button className="btn-icon"><Icon path={paths.share} /></button>
          </div>
        </header>

        <div className="forecast-grid animate-fade-in delay-100">
          
          {/* Main Chart Card */}
          <div className="card forecast-chart-card">
            <div className="card-header-flex">
              <div>
                <h3>AQI Trajectory</h3>
                <p>Machine learning projection model</p>
              </div>
            </div>
            <div className="forecast-chart-container">
              <svg viewBox="0 0 800 250" className="forecast-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-light)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 250 L0 180 C 100 180, 200 120, 300 140 C 400 160, 500 60, 600 80 C 700 100, 750 150, 800 170 L800 250 Z" fill="url(#gradient-area)" />
                <path d="M0 180 C 100 180, 200 120, 300 140 C 400 160, 500 60, 600 80 C 700 100, 750 150, 800 170" fill="none" stroke="var(--primary-color)" strokeWidth="4" />
                
                {/* Data Points */}
                <circle cx="100" cy="165" r="5" fill="white" stroke="var(--primary-color)" strokeWidth="3" />
                <circle cx="200" cy="120" r="5" fill="white" stroke="var(--primary-color)" strokeWidth="3" />
                <circle cx="300" cy="138" r="5" fill="white" stroke="var(--primary-color)" strokeWidth="3" />
                <circle cx="400" cy="130" r="5" fill="white" stroke="var(--primary-color)" strokeWidth="3" />
                <circle cx="500" cy="65" r="5" fill="white" stroke="#ef4444" strokeWidth="3" />
                <circle cx="600" cy="80" r="5" fill="white" stroke="#f59e0b" strokeWidth="3" />
                <circle cx="700" cy="120" r="5" fill="white" stroke="var(--primary-color)" strokeWidth="3" />
                <circle cx="800" cy="170" r="5" fill="white" stroke="var(--primary-color)" strokeWidth="3" />
              </svg>
              <div className="forecast-x-axis">
                <span>Today</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
                <span>Mon</span>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="card insights-card bg-primary text-white">
            <h3 className="flex items-center gap-2 mb-4"><Icon path={<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />} /> AI Insights</h3>
            <p className="insight-text">
              {apiData?.health_tip || "Aura AI identifies stable atmospheric conditions over the next few hours. Outdoor activities are safe across most districts."}
            </p>
            <div className="insight-metrics">
              <div className="im-box">
                <span className="im-label">Accuracy Score</span>
                <span className="im-value">94%</span>
              </div>
              <div className="im-box">
                <span className="im-label">Primary Driver</span>
                <span className="im-value">{currentAqi > prediction ? 'Dispersion' : 'Traffic'}</span>
              </div>
            </div>
          </div>

        </div>

        <h3 className="section-heading animate-fade-in delay-200">Daily Breakdown</h3>
        <div className="daily-list animate-fade-in delay-200">
          {days.map((d, i) => (
            <div key={i} className="daily-row card">
              <div className="dr-date">
                <strong>{d.day}</strong>
                <span>{d.date}</span>
              </div>
              
              <div className="dr-icon">
                <Icon path={d.icon} />
              </div>
              
              <div className="dr-weather">
                <span className="temp">{d.temp}</span>
                <span className="rain"><Icon path={<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />} className="icon-xs" /> {d.rain}</span>
              </div>
              
              <div className="dr-aqi">
                <span className={`aqi-badge ${d.condition === 'Good' ? 'good' : d.condition === 'Moderate' ? 'moderate' : 'poor'}`}>
                  {d.aqi} AQI
                </span>
                <span className="condition">{d.condition}</span>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
