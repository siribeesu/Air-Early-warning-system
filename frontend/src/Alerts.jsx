import React, { useState, useEffect } from 'react';
import './Alerts.css';
import { ML_API_BASE_URL } from './config';

const Icon = ({ path, className = '' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const paths = {
  warning:  <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  info:     <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  critical: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
  shield:   <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  check:    <><polyline points="20 6 9 17 4 12" /></>,
  mandate:  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />,
  login:    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />,
};

const SEVERITY_CONFIG = {
  CRITICAL: { cls: 'critical', icon: paths.critical, label: 'CRITICAL' },
  WARNING:  { cls: 'warning',  icon: paths.warning,  label: 'WARNING'  },
  INFO:     { cls: 'info',     icon: paths.info,      label: 'INFO'     },
};

export default function Alerts({ onNavigate, onLogout, locationQuery, user }) {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const query = locationQuery ||
          (user?.saved_locations?.length ? user.saved_locations[0].name : 'London, UK');
        const res  = await fetch(`${ML_API_BASE_URL}/api/aqi?location=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.status === 'success') {
          if (active) setApiData(json);
        } else {
          if (active) setError(json.message);
        }
      } catch {
        if (active) setError('Notification center offline.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [locationQuery]);

  if (loading) return (
    <main className="dashboard-main alerts-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '1px' }}>Synchronizing...</div>
    </main>
  );
  if (error) return (
    <main className="dashboard-main alerts-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>
    </main>
  );

  const alerts       = apiData?.alerts      || [];
  const directive    = apiData?.directive   || null;
  const dailyGuide   = apiData?.daily_guide || [];
  const locationName = apiData?.data?.location_name || locationQuery;
  const aqi          = apiData?.data?.aqi || 0;
  const healthTip    = apiData?.health_tip || '';
  const category     = apiData?.category || '';

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
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
        <div className="alerts-feed" style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* ── AQI Early-Warning Alerts (from ML prediction) ── */}
          <h3 className="section-heading">Predictive Air Quality Alerts</h3>

          {alerts.length > 0 ? (
            alerts.map((alert, idx) => {
              const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
              return (
                <div key={idx} className={`alert-card ${cfg.cls}`}>
                  <div className="alert-icon-wrapper">
                    <Icon path={cfg.icon} />
                  </div>
                  <div className="alert-content">
                    <div className="ac-header">
                      <h4>{alert.title}</h4>
                      <span className={`ac-badge ${cfg.cls}`}>{cfg.label}</span>
                      <span className="ac-time">Live · {timeStr}</span>
                    </div>
                    <p>{alert.message}</p>
                    <div className="ac-tags" style={{ marginTop: '0.75rem' }}>
                      <span className="ac-tag">{locationName}</span>
                      <span className="ac-tag">AQI {Math.round(aqi)}</span>
                      {apiData?.data?.predicted_aqi_6h && (
                        <span className="ac-tag">6h Prediction: {Math.round(apiData.data.predicted_aqi_6h)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="alert-card info">
              <div className="alert-icon-wrapper"><Icon path={paths.check} /></div>
              <div className="alert-content">
                <div className="ac-header">
                  <h4>No Active Predictive Alerts</h4>
                  <span className="ac-time">Updated {timeStr}</span>
                </div>
                <p>
                  Current AQI is <strong>{Math.round(aqi)}</strong> ({category}) in {locationName}.{' '}
                  {apiData?.data?.predicted_aqi_6h
                    ? `ML model predicts AQI of ${Math.round(apiData.data.predicted_aqi_6h)} in 6 hours — no significant deterioration expected.`
                    : 'No significant air quality changes predicted in the next 6 hours.'}
                </p>
              </div>
            </div>
          )}

          {/* ── Health Advisory ── */}
          {healthTip && (
            <>
              <h3 className="section-heading" style={{ marginTop: '1.5rem' }}>Health Advisory</h3>
              <div className="alert-card info">
                <div className="alert-icon-wrapper"><Icon path={paths.info} /></div>
                <div className="alert-content">
                  <div className="ac-header">
                    <h4>Region-Specific Health Guidance</h4>
                    <span className="ac-tag" style={{ marginLeft: 'auto' }}>{category}</span>
                  </div>
                  <p style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>{healthTip}</p>
                </div>
              </div>
            </>
          )}

          {/* ── Government Mandate (directive) ── */}
          <h3 className="section-heading" style={{ marginTop: '1.5rem' }}>Regulatory Directives</h3>

          {directive ? (
            <div className="alert-card critical">
              <div className="alert-icon-wrapper">
                <Icon path={paths.mandate} />
              </div>
              <div className="alert-content">
                <div className="ac-header">
                  <h4>Government Mandate — {directive.action}</h4>
                  <span className="ac-time">Live Sync</span>
                </div>
                <p style={{ fontWeight: '600', fontSize: '1rem', margin: '0.5rem 0 0.25rem' }}>
                  {directive.action}
                </p>
                <p>{directive.reason}</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                  Primary Driver: {directive.primary_driver}
                </p>
                <div className="ac-tags" style={{ marginTop: '0.75rem' }}>
                  <span className="ac-tag">{locationName}</span>
                  <span className="ac-tag danger">Enforcement Required</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert-card info">
              <div className="alert-icon-wrapper"><Icon path={paths.shield} /></div>
              <div className="alert-content">
                <h4>No Active Mandates</h4>
                <p>
                  Air quality in {locationName} is currently within regulatory thresholds.
                  {dailyGuide.length > 0
                    ? ` Active advisory: "${dailyGuide[0].title}" — ${dailyGuide[0].text}`
                    : ' No immediate government intervention is required.'}
                </p>
              </div>
            </div>
          )}

          {/* ── All daily guide items (collapsed cards) ── */}
          {dailyGuide.length > 0 && (
            <>
              <h3 className="section-heading" style={{ marginTop: '1.5rem' }}>All Regulatory Advisories</h3>
              {dailyGuide.map((item, idx) => (
                <div key={idx} className={`alert-card ${item.type === 'authority' ? 'warning' : 'info'}`}>
                  <div className="alert-icon-wrapper">
                    <Icon path={item.type === 'authority' ? paths.shield : paths.mandate} />
                  </div>
                  <div className="alert-content">
                    <div className="ac-header">
                      <h4>{item.title}</h4>
                      <span className="ac-tag">{item.type?.toUpperCase()}</span>
                    </div>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── Auth prompt ── */}
          {!user && (
            <div className="alert-card warning" style={{ marginTop: '1.5rem' }}>
              <div className="alert-icon-wrapper"><Icon path={paths.warning} /></div>
              <div className="alert-content">
                <h4>Authentication Required for Personal Alerts</h4>
                <p>
                  Sign in to receive automated regulatory warnings and personalised health advisories
                  tailored to your saved locations in {locationName}.
                </p>
                <button
                  className="btn btn-primary btn-sm mt-2"
                  onClick={() => onNavigate('login')}
                  style={{ marginTop: '0.75rem' }}
                >
                  <Icon path={paths.login} className="icon-xs" /> Login Now
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
