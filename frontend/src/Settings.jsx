import React, { useState, useEffect } from 'react';
import './Settings.css';
import { API_BASE_URL } from './config';

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
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  bell: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />,
  location: <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />,
  save: <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
};

export default function Settings({ onNavigate, onLogout, user }) {
  const [settings, setSettings] = useState({
    saved_locations: [],
    notification_frequency: 'Everyday',
    notifications_enabled: true,
    risk_threshold: 'Moderate'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const handleAddLocation = () => {
    if (newLocation.trim() && !settings.saved_locations.includes(newLocation.trim())) {
      setSettings({
        ...settings,
        saved_locations: [...settings.saved_locations, newLocation.trim()]
      });
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (loc) => {
    setSettings({
      ...settings,
      saved_locations: settings.saved_locations.filter(l => l !== loc)
    });
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/user/settings`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Settings updated successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Failed to synchronize with atmospheric node');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <main className="settings-main" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{color: '#64748b', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '1px'}}>Synchronizing...</div>
    </main>
  );

  return (
    <>
      <main className="settings-main">
        <header className="settings-header">
          <h1>Authority Control Settings</h1>
          <p>Configure regional monitoring and regulatory notification protocols.</p>
        </header>

        <div className="settings-grid">
          {/* Location Monitoring Card */}
          <section className="settings-card">
            <div className="card-icon"><Icon path={paths.location} /></div>
            <h2>Regional Monitoring</h2>
            <p>Define the primary atmospheric zones for automated oversight.</p>
            
            <div className="location-chips">
              {settings.saved_locations?.map((loc, idx) => (
                <div key={idx} className="location-chip">
                  <span>{loc}</span>
                  <button onClick={() => handleRemoveLocation(loc)} className="chip-remove">&times;</button>
                </div>
              ))}
            </div>

            <div className="form-group add-location-group">
              <label>Add Designated Zone</label>
              <div className="add-location-input">
                <input 
                  type="text" 
                  value={newLocation} 
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                  placeholder="Enter city or region"
                />
                <button className="btn-add" onClick={handleAddLocation}>Add</button>
              </div>
            </div>
          </section>

          {/* Notification Protocol Card */}
          <section className="settings-card">
            <div className="card-icon"><Icon path={paths.bell} /></div>
            <h2>Notification Protocol</h2>
            <p>Set the frequency of regulatory reports and health alerts.</p>
            
            <div className="form-group">
              <label>Directive Frequency</label>
              <select 
                value={settings.notification_frequency}
                onChange={(e) => setSettings({...settings, notification_frequency: e.target.value})}
              >
                <option value="Everyday">Everyday (Real-time)</option>
                <option value="Weekly">Weekly Digest</option>
                <option value="Monthly">Monthly Summary</option>
                <option value="Yearly">Yearly Atmospheric Report</option>
              </select>
            </div>

            <div className="form-group toggle-group">
              <label>Enable Automated Directives</label>
              <button 
                className={`toggle-btn ${settings.notifications_enabled ? 'active' : ''}`}
                onClick={() => setSettings({...settings, notifications_enabled: !settings.notifications_enabled})}
              >
                <div className="toggle-slider"></div>
              </button>
            </div>
          </section>

          {/* Risk Threshold Card */}
          <section className="settings-card">
            <div className="card-icon"><Icon path={paths.alerts} /></div>
            <h2>Alert Threshold</h2>
            <p>Define the pollution severity level that triggers societal mandates.</p>
            
            <div className="form-group">
              <label>Critical Sensitivity</label>
              <select 
                value={settings.risk_threshold}
                onChange={(e) => setSettings({...settings, risk_threshold: e.target.value})}
              >
                <option value="Good">Minimal (AQI 50+)</option>
                <option value="Moderate">Moderate (AQI 100+)</option>
                <option value="Unhealthy">High (AQI 150+)</option>
                <option value="Hazardous">Emergency Only (AQI 300+)</option>
              </select>
            </div>
          </section>
        </div>

        <footer className="settings-actions">
          {message && <span className="status-message">{message}</span>}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Icon path={paths.save} /> {saving ? 'Synchronizing...' : 'Save Configuration'}
          </button>
        </footer>
      </main>
    </>
  );
}
