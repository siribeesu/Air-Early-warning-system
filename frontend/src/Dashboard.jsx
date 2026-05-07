import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5001';

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
        const query = locationQuery || (user?.saved_locations && user.saved_locations.length > 0 ? user.saved_locations[0].name : 'London, UK');
        const res = await fetch(`${ML_API_BASE_URL}/api/aqi?location=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.status === 'success') {
          if (active) setApiData(json);
        } else {
          if (active) setError(json.message || 'Failed to fetch');
        }
      } catch (err) {
        if (active) setError('Could not connect to Air backend.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [locationQuery]);

  const [viewMode, setViewMode] = useState('day'); // 'day' or 'week'

  if (loading) return (
    <main className="dashboard-main" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{color: '#64748b', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '1px'}}>Synchronizing...</div>
    </main>
  );
  if (error) return (
    <main className="dashboard-main" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{color: '#dc2626', fontSize: '0.9rem', fontWeight: '500'}}>{error}</div>
    </main>
  );

  const metrics = apiData?.data || {};
  const forecast = apiData?.forecast || { hourly: [], daily: [] };
  const currentCategory = apiData?.category || 'Moderate';
  const categoryClass = currentCategory.split(' ')[0].toLowerCase() === 'good' ? 'good' : (currentCategory.split(' ')[0].toLowerCase() === 'hazardous' ? 'poor' : 'moderate');

  // Gauge calculations
  const aqiValue = Math.round(metrics.aqi || 0);
  const aqiPercent = Math.min(aqiValue / 300, 1);
  const arcLength = 151; // Precise length for the r=35 symmetrical arc defined in the path
  const dashOffset = arcLength * (1 - aqiPercent);

  return (
    <>
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
              <div className="metric-bar">
                <div className={`fill ${metrics.pm25 > 35 ? 'poor' : metrics.pm25 > 12 ? 'moderate' : 'good'}`}
                     style={{width: `${Math.min(100, (metrics.pm25/50)*100)}%`}}></div>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <div className="metric-icon"><Icon path={paths.particles} /></div>
              </div>
              <div className="metric-value">
                <span className="label">PM 10</span>
                <div className="value">{metrics.pm10} <span className="unit">µg/m³</span></div>
              </div>
              <div className="metric-bar">
                <div className={`fill ${metrics.pm10 > 54 ? 'poor' : metrics.pm10 > 20 ? 'moderate' : 'good'}`}
                     style={{width: `${Math.min(100, (metrics.pm10/100)*100)}%`}}></div>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <div className="metric-icon"><Icon path={paths.chemistry} /></div>
              </div>
              <div className="metric-value">
                <span className="label">NO2</span>
                <div className="value">{metrics.no2} <span className="unit">ppb</span></div>
              </div>
              <div className="metric-bar">
                <div className={`fill ${metrics.no2 > 40 ? 'poor' : metrics.no2 > 15 ? 'moderate' : 'good'}`}
                     style={{width: `${Math.min(100, (metrics.no2/50)*100)}%`}}></div>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <div className="metric-icon"><Icon path={paths.sun} /></div>
              </div>
              <div className="metric-value">
                <span className="label">O3 (Ozone)</span>
                <div className="value">{metrics.o3} <span className="unit">ppb</span></div>
              </div>
              <div className="metric-bar">
                <div className={`fill ${metrics.o3 > 70 ? 'poor' : metrics.o3 > 40 ? 'moderate' : 'good'}`}
                     style={{width: `${Math.min(100, (metrics.o3/100)*100)}%`}}></div>
              </div>
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
                <button className={viewMode === 'day' ? 'active' : ''} onClick={() => setViewMode('day')}>Day</button>
                <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Week</button>
              </div>
            </div>
            
            <div className="chart-bars-container">
              {viewMode === 'day' ? (
                (forecast.hourly || []).map((item, i) => {
                  const barHeight = Math.min(100, (item.aqi / 300) * 100);
                  const isCurrentHour = new Date().getHours() === item.hour;
                  return (
                    <div key={i} className={`bar-wrapper ${isCurrentHour ? 'active' : ''}`} title={`Time: ${item.time}, AQI: ${item.aqi}`}>
                      <div className="bar" style={{height: `${barHeight || 10}%`}}></div>
                      {i % 4 === 0 && <div className="label">{item.time}</div>}
                    </div>
                  );
                })
              ) : (
                (forecast.daily || []).map((item, i) => {
                  const barHeight = Math.min(100, (item.aqi / 300) * 100);
                  return (
                    <div key={i} className="bar-wrapper" title={`Day: ${item.day}, AQI: ${item.aqi}`}>
                      <div className="bar" style={{height: `${barHeight || 10}%`}}></div>
                      <div className="label">{item.day}</div>
                    </div>
                  );
                })
              )}
              {((viewMode === 'day' && (!forecast.hourly || forecast.hourly.length === 0)) || 
                (viewMode === 'week' && (!forecast.daily || forecast.daily.length === 0))) && (
                <div style={{color:'#64748b', fontSize:'0.85rem', margin:'auto'}}>Temporal data unavailable</div>
              )}
            </div>
          </div>

          {/* Regulatory Directives */}
          <div className="card guide-card bg-primary text-white">
            <h3 className="flex items-center gap-2"><Icon path={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />} /> Regulatory Directives</h3>
            <ul className="guide-list">
              {(apiData?.daily_guide || []).map((item, idx) => (
                <li key={idx}>
                  <div className="guide-icon">
                    <Icon path={item.type === 'policy' ? paths.dashboard : (item.type === 'regulation' ? paths.settings : paths.alerts)} />
                  </div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Live Map */}
          <div className="card map-card">
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" alt="Map" />
            <div className="map-overlay">
              <button className="btn btn-sm btn-glass"><Icon path={<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />} /> Expand Map</button>
              <div className="map-info">
                <h4>Temporal Atmospheric Degradation</h4>
                <p>Real-time particle dispersion visualization</p>
              </div>
            </div>
          </div>

          {/* Emission Sources */}
          <div className="card emission-card">
            <h3>Local Emission Sources</h3>
            <div className="source-list">
              {(apiData?.emission_sources?.breakdown || []).map((source, idx) => (
                <div className="source-item" key={idx}>
                  <div className="source-header"><span>{source.name}</span><span>{source.value}%</span></div>
                  <div className="progress-bar">
                    <div 
                      className="fill" 
                      style={{
                        width: `${source.value}%`, 
                        backgroundColor: source.color || 'var(--primary-color)'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="note-box">
              <p><strong>Observer Note:</strong> {apiData?.emission_sources?.note || "Data analysis in progress."}</p>
            </div>
          </div>

          {/* Hyper-local PurpleAir Insight */}
          <div className="card hyperlocal-card">
            <div className="metric-header">
              <div className="metric-icon text-primary"><Icon path={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />} /></div>
              <span className="text-xs font-bold text-gray uppercase tracking-wider">{apiData?.hyperlocal?.provider || 'PurpleAir'}</span>
            </div>
            <h3>Hyper-local Insight</h3>
            <div className="hyperlocal-content">
              <div className="stat">
                <span className="label">Nearby Sensors</span>
                <span className="value">{apiData?.hyperlocal?.sensor_count || 0}</span>
              </div>
              <div className="stat">
                <span className="label">Avg PM2.5</span>
                <span className="value">{apiData?.hyperlocal?.avg_pm25 || '--'}</span>
              </div>
            </div>
            <p className="note">{apiData?.hyperlocal?.note || "Syncing with neighborhood sensor mesh..."}</p>
          </div>

          {/* Long-term Projection Timeline */}
          <div className="card projection-card">
            <div className="card-header-flex">
              <div>
                <h3>Temporal Atmospheric Degradation</h3>
                <p>Growth Ratio: <span className="text-accent">{apiData?.projection?.growth_ratio}</span> Annually</p>
              </div>
              <div className={`risk-badge ${apiData?.projection?.risk_level?.toLowerCase()}`}>
                {apiData?.projection?.risk_level} RISK
              </div>
            </div>
            
            <div className="tipping-point-alert">
              <div className="alert-icon">⚠️</div>
              <div className="alert-text">
                <strong>Tipping Point:</strong> {apiData?.projection?.tipping_point_desc}
              </div>
            </div>

            <div className="projection-timeline">
              {(apiData?.projection?.milestones || []).map((m, i) => (
                <div className="timeline-item" key={i}>
                  <div className="period">{m.period}</div>
                  <div className="aqi-val">{m.aqi}</div>
                  <div className={`status ${m.status.toLowerCase()}`}>{m.status}</div>
                </div>
              ))}
            </div>
            
            <div className="projection-footer">
              <p>Projections based on current vehicular and industrial emission velocity.</p>
            </div>
          </div>

          {/* Environmental News Section */}
          <div className="card news-card">
            <h3>Environmental Intelligence</h3>
            <div className="news-list">
              {(apiData?.news || []).map((art, idx) => (
                <a href={art.url} target="_blank" rel="noopener noreferrer" className="news-item" key={idx}>
                  {art.image && <img src={art.image} alt="News" className="news-img" />}
                  <div className="news-content">
                    <span className="news-source">{art.source} • {new Date(art.publishedAt).toLocaleDateString()}</span>
                    <h4>{art.title}</h4>
                    <p>{art.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand">Air<span>Intelligence</span></div>
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
            <div className="copyright">© 2026 Air Intelligence. Breathing room for your data.</div>
            <div className="social-icons">
              <a href="#" aria-label="Globe"><Icon path={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>} /></a>
              <a href="#" aria-label="Share"><Icon path={<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>} /></a>
            </div>
          </div>
        </div>
      </footer>
      </main>
    </>
  );
}
