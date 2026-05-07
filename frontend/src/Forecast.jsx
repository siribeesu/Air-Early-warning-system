import React, { useState, useEffect } from 'react';
import './Forecast.css';
import { ML_API_BASE_URL } from './config';

const Icon = ({ path, className = '' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const paths = {
  share:   <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />,
  sun:     <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>,
  cloud:   <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  wind:    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8A2.5 2.5 0 1 1 19.5 12H2" />,
  droplet: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  ai:      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
  trending_up:   <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />,
  trending_down: <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCategory(aqi) {
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy (Sensitive)';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function getCategoryClass(aqi) {
  if (aqi <= 50)  return 'good';
  if (aqi <= 100) return 'moderate';
  return 'poor';
}

function getDayIcon(aqi) {
  if (aqi <= 50)  return paths.sun;
  if (aqi <= 100) return paths.cloud;
  if (aqi <= 150) return paths.wind;
  return paths.droplet;
}

function getDominantPollutant(data) {
  const pm25 = data.pm25 || 0;
  const no2  = data.no2  || 0;
  const o3   = data.o3   || 0;
  const co   = data.co   || 0;
  const scores = {
    'PM2.5':  pm25 / 12,
    'NO2':    no2  / 40,
    'Ozone':  o3   / 70,
    'CO':     co   / 1000,
  };
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
}

// Build a smooth SVG bezier path from an array of [aqi] values
function buildChartPaths(aqiValues) {
  const W = 800, H = 250, PAD_T = 25, PAD_B = 30;
  const toY = (aqi) => H - PAD_B - ((Math.min(Math.max(aqi, 0), 300) / 300) * (H - PAD_T - PAD_B));

  if (aqiValues.length < 2) return { line: '', area: '' };

  const step = W / (aqiValues.length - 1);
  const pts  = aqiValues.map((aqi, i) => ({ x: i * step, y: toY(aqi) }));

  let line = `M${pts[0].x} ${pts[0].y}`;
  let area = `M0 ${H} L${pts[0].x} ${pts[0].y}`;

  for (let i = 1; i < pts.length; i++) {
    const cpx1 = pts[i - 1].x + step * 0.4;
    const cpx2 = pts[i].x - step * 0.4;
    const seg  = ` C${cpx1} ${pts[i - 1].y}, ${cpx2} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    line += seg;
    area += seg;
  }
  area += ` L${W} ${H} Z`;

  return { line, area, pts };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Forecast({ onNavigate, onLogout, locationQuery, user }) {
  const [apiData, setApiData]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

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
          if (active) setError(json.message || 'Failed to fetch forecast');
        }
      } catch {
        if (active) setError('Could not connect to predictive engine.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [locationQuery]);

  if (loading) return (
    <main className="dashboard-main forecast-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '1px' }}>Synchronizing...</div>
    </main>
  );
  if (error) return (
    <main className="dashboard-main forecast-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>
    </main>
  );

  const data         = apiData?.data || {};
  const currentAqi   = Math.round(data.aqi || 0);
  const prediction   = Math.round(data.predicted_aqi_6h || currentAqi);
  const dailyForecast = (apiData?.forecast?.daily || []).slice(0, 7);
  const dominant     = getDominantPollutant(data);

  // ── Build dynamic day rows ──────────────────────────────────────────────────
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const days = [];

  // Row 0 — Today (live)
  days.push({
    day:       'Today',
    date:      'LIVE',
    aqi:       currentAqi,
    condition: apiData?.category || getCategory(currentAqi),
    icon:      getDayIcon(currentAqi),
    temp:      data.temp != null ? `${Math.round(data.temp)}°C` : '--',
    rain:      data.humidity != null ? `${Math.round(data.humidity)}% RH` : '--',
  });

  // Row 1 — 6h ML Prediction
  days.push({
    day:       '6h Ahead',
    date:      'ML PREDICTED',
    aqi:       prediction,
    condition: getCategory(prediction),
    icon:      getDayIcon(prediction),
    temp:      data.temp != null ? `${Math.round(data.temp - 1)}°C` : '--',
    rain:      'ML Model',
  });

  // Rows 2-7 — Real 7-day forecast from Open-Meteo (skip today which is index 0)
  const futureDays = dailyForecast.slice(1, 6);
  futureDays.forEach((d) => {
    let label    = d.day;   // abbreviated: Mon, Tue …
    let dateLabel = '';

    if (d.date) {
      const dt  = new Date(d.date + 'T12:00:00');
      label     = DAY_NAMES[dt.getDay()];
      dateLabel = `${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
    }

    days.push({
      day:       label,
      date:      dateLabel,
      aqi:       d.aqi,
      condition: getCategory(d.aqi),
      icon:      getDayIcon(d.aqi),
      temp:      d.temp_max != null ? `${Math.round(d.temp_max)}°C` : '--',
      rain:      d.precip  != null ? `${d.precip} mm` : '--',
    });
  });

  // ── Chart data from daily forecast ─────────────────────────────────────────
  const chartAqiValues = [
    currentAqi,
    ...dailyForecast.slice(1).map(d => d.aqi)
  ].filter(v => v != null);

  const { line: chartLine, area: chartArea, pts: chartPts } = buildChartPaths(chartAqiValues);

  const chartLabels = [
    'Today',
    ...dailyForecast.slice(1, 7).map(d => {
      if (d.date) {
        const dt = new Date(d.date + 'T12:00:00');
        return d.day || DAY_NAMES[dt.getDay()].slice(0, 3);
      }
      return d.day;
    })
  ].slice(0, chartAqiValues.length);

  // ── AI Insights ────────────────────────────────────────────────────────────
  const isDeteriorating = prediction > currentAqi;
  const delta    = Math.abs(prediction - currentAqi);
  const trendPct = currentAqi > 0 ? Math.round((delta / currentAqi) * 100) : 0;
  const trendText = isDeteriorating
    ? `worsening by ${delta} AQI (+${trendPct}%)`
    : delta > 0
      ? `improving by ${delta} AQI (-${trendPct}%)`
      : 'stable — no significant change expected';

  return (
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

        {/* Dynamic AQI Trajectory Chart */}
        <div className="card forecast-chart-card">
          <div className="card-header-flex">
            <div>
              <h3>AQI Trajectory</h3>
              <p>7-day Open-Meteo forecast · ML-enhanced 6h prediction</p>
            </div>
          </div>
          <div className="forecast-chart-container">
            <svg viewBox="0 0 800 250" className="forecast-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--primary-light)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0"  />
                </linearGradient>
              </defs>
              {chartArea && (
                <path d={chartArea} fill="url(#gradient-area)" />
              )}
              {chartLine && (
                <path d={chartLine} fill="none" stroke="var(--primary-color)" strokeWidth="3" />
              )}
              {chartPts && chartPts.map((pt, i) => {
                const aqi   = chartAqiValues[i];
                const color = aqi > 150 ? '#ef4444' : aqi > 100 ? '#f59e0b' : 'var(--primary-color)';
                return (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="white" stroke={color} strokeWidth="3" />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fill={color}
                      fontSize="11"
                      fontWeight="600"
                    >
                      {aqi}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="forecast-x-axis">
              {chartLabels.map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="card insights-card bg-primary text-white">
          <h3 className="flex items-center gap-2 mb-4">
            <Icon path={paths.ai} /> AI Insights
          </h3>
          <p className="insight-text">
            {apiData?.health_tip || "Connecting to predictive engine…"}
          </p>
          <div className="insight-metrics">
            <div className="im-box">
              <span className="im-label">6h Trend</span>
              <span className="im-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon path={isDeteriorating ? paths.trending_up : paths.trending_down} className="icon-xs" />
                {isDeteriorating ? '↑' : '↓'} {trendText.split(' ')[0]}
              </span>
            </div>
            <div className="im-box">
              <span className="im-label">Primary Driver</span>
              <span className="im-value">{dominant}</span>
            </div>
            <div className="im-box">
              <span className="im-label">6h Predicted AQI</span>
              <span className="im-value">{prediction}</span>
            </div>
            <div className="im-box">
              <span className="im-label">Model</span>
              <span className="im-value">Random Forest</span>
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
              <span className="rain">
                <Icon path={paths.droplet} className="icon-xs" /> {d.rain}
              </span>
            </div>

            <div className="dr-aqi">
              <span className={`aqi-badge ${getCategoryClass(d.aqi)}`}>
                {d.aqi} AQI
              </span>
              <span className="condition">{d.condition}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
