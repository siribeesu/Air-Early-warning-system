import React, { useState, useEffect } from 'react';
import './Dashboard.css';
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
  wind: <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8A2.5 2.5 0 1 1 19.5 12H2" />,
  particles: <circle cx="12" cy="12" r="2" />,
  chemistry: <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.31a4 4 0 1 1-4 0" />,
  sun: <circle cx="12" cy="12" r="5" />,
  run: <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 0c-1.5 0-3 1-3 2.5V13h-2M15 13l-3-2.5v4.5l3 3M12 15v6" />,
  window: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
  mask: <path d="M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2 2 6.48 2 12z" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  login: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
};

export default function Dashboard({ onNavigate, onLogout, locationQuery, user }) {
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
          if (active) setError(json.message || 'Failed to fetch');
        }
      } catch (err) {
        if (active) setError('Could not connect to Aura backend.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [locationQuery]);

  if (loading) return <div className="dashboard-layout"><div style={{margin:'auto', padding:'5rem', fontSize:'1.5rem', fontWeight:'bold'}}>Initializing Neural Sensors...</div></div>;
  if (error) return <div className="dashboard-layout"><div style={{margin:'auto', padding:'5rem', fontSize:'1.5rem', color:'red'}}>Error: {error}</div></div>;

  const metrics = apiData?.data || {};
  const currentCategory = apiData?.category || 'Moderate';
  const categoryClass = currentCategory.split(' ')[0].toLowerCase() === 'good' ? 'good' : (currentCategory.split(' ')[0].toLowerCase() === 'hazardous' ? 'poor' : 'moderate');

  // Gauge calculations
  const aqiValue = Math.round(metrics.aqi || 0);
  const aqiPercent = Math.min(aqiValue / 300, 1);
  const arcLength = 151; // Precise length for the r=35 symmetrical arc defined in the path
  const dashOffset = arcLength * (1 - aqiPercent);

  return (
    <>
      <div className="dashboard-layout">
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
            <li><a href="#" className="active" onClick={() => onNavigate && onNavigate('dashboard')}><Icon path={paths.dashboard} /> Dashboard</a></li>
            <li><a href="#" onClick={() => onNavigate && onNavigate('heatmap')}><Icon path={paths.heatmap} /> Heatmap</a></li>
            <li><a href="#" onClick={() => onNavigate && onNavigate('forecast')}><Icon path={paths.forecast} /> Forecast</a></li>
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

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <div className="location-context">
              <Icon path={<circle cx="12" cy="10" r="3" />} className="icon-sm text-primary" /> CURRENT OBSERVATORY
            </div>
            <h1>{metrics.location_name || locationQuery}</h1>
            <p className="subtitle">Observatory Station • Updated Live</p>
          </div>
          <div className="header-actions">

            <button className="btn-icon"><Icon path={paths.share} /></button>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Main AQI Gauge */}
          <div className="card aqi-card">
            <div className="metric-header">
              <div className="metric-icon"><Icon path={paths.mask} /></div>
            </div>
            <h4>AIR QUALITY INDEX</h4>
            
            <div className="gauge-wrapper">
              <div className="gauge-container">
                <div className="gauge-circle">
                  <svg viewBox="0 0 100 100" className="gauge-svg">
                    {/* Background Arc */}
                    <path 
                      d="M20,70 A35,35 0 1,1 80,70" 
                      fill="none" 
                      stroke="#e2e8f0" 
                      strokeWidth="8" 
                      strokeLinecap="round" 
                    />
                    {/* Colored Value Arc */}
                    <path 
                      d="M20,70 A35,35 0 1,1 80,70" 
                      fill="none" 
                      stroke={`var(--${categoryClass}-color, var(--primary-color))`} 
                      strokeWidth="8" 
                      strokeLinecap="round" 
                      strokeDasharray={arcLength}
                      strokeDashoffset={dashOffset}
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <div className="gauge-content">
                    <h2>{aqiValue}</h2>
                    <p>US AQI</p>
                  </div>
                </div>
              </div>
              <div className={`aqi-status ${categoryClass}`}>{currentCategory.toUpperCase()}</div>
            </div>
            
            <p className="aqi-desc">{apiData?.health_tip || "The air quality is ideal for most individuals."}</p>
          </div>

          {/* Sub-metrics Grid */}
          <div className="metrics-grid">
            <div className="card metric-card">
              <div className="metric-header">
                <div className="metric-icon"><Icon path={paths.wind} /></div>
              </div>
              <div className="metric-value">
                <span className="label">PM 2.5</span>
                <div className="value">{metrics.pm25} <span className="unit">µg/m³</span></div>
              </div>
              <div className="metric-bar"><div className="fill good" style={{width: `${Math.min(100, (metrics.pm25/50)*100)}%`}}></div></div>
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <div className="metric-icon"><Icon path={paths.particles} /></div>
              </div>
              <div className="metric-value">
                <span className="label">PM 10</span>
                <div className="value">{metrics.pm10} <span className="unit">µg/m³</span></div>
              </div>
              <div className="metric-bar"><div className="fill good" style={{width: `${Math.min(100, (metrics.pm10/100)*100)}%`}}></div></div>
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <div className="metric-icon"><Icon path={paths.chemistry} /></div>
              </div>
              <div className="metric-value">
                <span className="label">NO2</span>
                <div className="value">{metrics.no2} <span className="unit">ppb</span></div>
              </div>
              <div className="metric-bar"><div className="fill good" style={{width: `${Math.min(100, (metrics.no2/50)*100)}%`}}></div></div>
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <div className="metric-icon"><Icon path={paths.sun} /></div>
              </div>
              <div className="metric-value">
                <span className="label">O3 (Ozone)</span>
                <div className="value">{metrics.o3} <span className="unit">ppb</span></div>
              </div>
              <div className="metric-bar"><div className="fill moderate" style={{width: `${Math.min(100, (metrics.o3/60)*100)}%`}}></div></div>
            </div>
          </div>

          {/* Evolution Chart */}
          <div className="card chart-card">
            <div className="card-header-flex">
              <div className="flex items-center gap-3">
                <div className="metric-icon text-primary"><Icon path={paths.forecast} /></div>
                <div>
                  <h3>AQI Evolution</h3>
                  <p>24-hour temporal atmospheric trend</p>
                </div>
              </div>
              <div className="toggle-group">
                <button className="active">Day</button>
                <button>Week</button>
              </div>
            </div>
            
            <div className="chart-bars-container">
              {[40, 35, 30, 45, 60, 80, 50, 20, 35, 60, 55, 40].map((h, i) => (
                <div key={i} className={`bar-wrapper ${i===7 ? 'active' : ''}`}>
                  <div className="bar" style={{height: `${h}%`}}></div>
                  {i % 2 === 0 && <div className="label">{(i*2).toString().padStart(2,'0')}:00</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Daily Guide */}
          <div className="card guide-card bg-primary text-white">
            <h3 className="flex items-center gap-2"><Icon path={<path d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" />} /> Daily Guide</h3>
            <ul className="guide-list">
              <li>
                <div className="guide-icon"><Icon path={paths.run} /></div>
                <div>
                  <h4>Outdoor Exercise</h4>
                  <p>Perfect conditions for high-intensity training. The air is crisp and clean.</p>
                </div>
              </li>
              <li>
                <div className="guide-icon"><Icon path={paths.window} /></div>
                <div>
                  <h4>Ventilation</h4>
                  <p>Recommended to open windows for natural air circulation today.</p>
                </div>
              </li>
              <li>
                <div className="guide-icon"><Icon path={paths.mask} /></div>
                <div>
                  <h4>Vulnerable Groups</h4>
                  <p>No specific precautions needed for sensitive individuals.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Live Map */}
          <div className="card map-card">
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" alt="Map" />
            <div className="map-overlay">
              <button className="btn btn-sm btn-glass"><Icon path={<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />} /> Expand Map</button>
              <div className="map-info">
                <h4>Live Atmospheric Map</h4>
                <p>Real-time particle dispersion visualization</p>
              </div>
            </div>
          </div>

          {/* Emission Sources */}
          <div className="card emission-card">
            <h3>Local Emission Sources</h3>
            <div className="source-list">
              <div className="source-item">
                <div className="source-header"><span>VEHICLES</span><span>65%</span></div>
                <div className="progress-bar"><div className="fill bg-primary" style={{width: '65%'}}></div></div>
              </div>
              <div className="source-item">
                <div className="source-header"><span>INDUSTRIAL</span><span>12%</span></div>
                <div className="progress-bar"><div className="fill" style={{width: '12%'}}></div></div>
              </div>
              <div className="source-item">
                <div className="source-header"><span>CONSTRUCTION</span><span>18%</span></div>
                <div className="progress-bar"><div className="fill" style={{width: '18%'}}></div></div>
              </div>
              <div className="source-item">
                <div className="source-header"><span>OTHERS</span><span>5%</span></div>
                <div className="progress-bar"><div className="fill" style={{width: '5%'}}></div></div>
              </div>
            </div>
            <div className="note-box">
              <p><strong>Observer Note:</strong> Vehicle emissions are currently peak for Monday morning commute. Expect a 15% drop by 11:00 AM.</p>
            </div>
          </div>

        </div>
      </main>
      </div>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand">Aura<span>Intelligence</span></div>
              <p className="footer-desc">
                Providing real-time atmospheric insights with precision and clarity. The air we breathe, decoded.
              </p>
            </div>
            
            <div>
              <div className="footer-col-title">PRODUCT</div>
              <div className="footer-links">
                <a href="#">API Docs</a>
                <a href="#">Forecasting</a>
                <a href="#">Hardware</a>
              </div>
            </div>
            
            <div>
              <div className="footer-col-title">COMPANY</div>
              <div className="footer-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact Us</a>
              </div>
            </div>

            <div>
              <div className="footer-col-title">NEWSLETTER</div>
              <div className="newsletter-form">
                <input type="email" placeholder="Email" className="newsletter-input" />
                <button className="btn-newsletter"><Icon path={<path d="M5 3l14 9-14 9V3z" />} /></button>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="copyright">© 2024 Aura Intelligence. Breathing room for your data.</div>
            <div className="social-icons">
              <a href="#" aria-label="Globe"><Icon path={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>} /></a>
              <a href="#" aria-label="Share"><Icon path={<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>} /></a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
