import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Heatmap.css';
import { ML_API_BASE_URL } from './config';

// Helper to update map view when coordinates change
function MapController({ center, zoom, zoomLevel }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);

  useEffect(() => {
    if (zoomLevel !== undefined) map.setZoom(zoomLevel);
  }, [zoomLevel, map]);

  return null;
}

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
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  wind: <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8A2.5 2.5 0 1 1 19.5 12H2" />,
  particles: <circle cx="12" cy="12" r="2" />,
  cloud: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  login: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
};

export default function Heatmap({ onNavigate, onLogout, locationQuery, setSearchQuery, user }) {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localSearch, setLocalSearch] = useState(locationQuery || '');
  const [zoomLevel, setZoomLevel] = useState(13);

  useEffect(() => {
    setLocalSearch(locationQuery || '');
  }, [locationQuery]);

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
          if (active) setError(json.message);
        }
      } catch (err) {
        if (active) setError('Could not connect to sensor grid.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [locationQuery]);

  if (loading) return (
    <main className="heatmap-main" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a'}}>
      <div style={{color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '1px'}}>Synchronizing...</div>
    </main>
  );

  const data = apiData?.data || {};
  const currentCategory = apiData?.category || 'N/A';
  const aqi = Math.round(data.aqi || 0);
  
  const getAQIColor = (aqiValue) => {
    if (aqiValue <= 50) return '#00e400'; // Green
    if (aqiValue <= 100) return '#ffff00'; // Yellow
    if (aqiValue <= 150) return '#ff7e00'; // Orange
    if (aqiValue <= 200) return '#ff0000'; // Red
    if (aqiValue <= 300) return '#8f3f97'; // Purple
    return '#7e0023'; // Maroon
  };

  const handleLocalSearch = (e) => {
    if (e.key === 'Enter') {
      if (setSearchQuery) {
        setSearchQuery(localSearch);
      }
    }
  };

  return (
    <>
      {/* Main Map Area */}
      <main className="heatmap-main">
        <div className="map-wrapper" style={{ height: '100%', width: '100%' }}>
          {data.lat && data.lon && (
            <MapContainer 
              center={[data.lat, data.lon]} 
              zoom={zoomLevel} 
              scrollWheelZoom={true}
              zoomControl={false}
              style={{ height: '100%', width: '100%', background: '#0f172a' }}
            >
              <MapController center={[data.lat, data.lon]} zoomLevel={zoomLevel} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              
              {/* Regional Ambient Pollution (City Level) */}
              <Circle
                center={[data.lat, data.lon]}
                pathOptions={{ 
                  fillColor: getAQIColor(aqi), 
                  color: 'transparent',
                  fillOpacity: 0.25
                }}
                radius={5000}
              />

              {/* Hyper-local PurpleAir Simulation Points (Using CircleMarker for pixel-constant size) */}
              {Array.from({length: 8}).map((_, i) => {
                const angle = (i / 8) * 2 * Math.PI;
                const r = 0.015;
                const sLat = data.lat + r * Math.cos(angle);
                const sLon = data.lon + r * Math.sin(angle);
                const sAqi = aqi + (Math.random() * 40 - 20); // Variety in neighborhood
                return (
                  <CircleMarker
                    key={i}
                    center={[sLat, sLon]}
                    pathOptions={{ 
                      fillColor: getAQIColor(sAqi), 
                      color: '#ffffff',
                      weight: 2,
                      fillOpacity: 1
                    }}
                    radius={8}
                  />
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Search Bar */}
        <div className="heatmap-search">
          <Icon path={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} className="text-gray" />
          <input 
            type="text" 
            placeholder="Search atmospheric zones..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleLocalSearch}
          />
        </div>

        {/* Tool Strips */}
        <div className="heatmap-tools">
          <button className="tool-btn active">
            <Icon path={paths.wind} />
            <span>AQI</span>
          </button>
          <button className="tool-btn">
            <Icon path={paths.particles} />
            <span>PM2.5</span>
          </button>
          <button className="tool-btn">
            <Icon path={paths.cloud} />
            <span>NO2</span>
          </button>
        </div>

        <div className="heatmap-zoom">
          <button className="zoom-btn" onClick={() => setZoomLevel(prev => Math.min(prev + 1, 18))}>+</button>
          <button className="zoom-btn" onClick={() => setZoomLevel(prev => Math.max(prev - 1, 1))}>−</button>
        </div>

        {/* Info Card overlay */}
        <div className="heatmap-info-card">
          <div className="info-header">
            <h2>{data.location_name || 'Location'}</h2>
            <span className={`badge-${currentCategory.toLowerCase().split(' ')[0]}`}>{currentCategory.toUpperCase()}</span>
          </div>
          <p className="info-district">Lat: {data.lat?.toFixed(4)} • Lon: {data.lon?.toFixed(4)}</p>

          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">OVERALL AQI</div>
              <div className="stat-value">{aqi}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">PM2.5 CONC.</div>
              <div className="stat-value">{data.pm25} <span className="stat-unit">µg/m³</span></div>
            </div>
          </div>

          <div className="scale-container">
            <div className="scale-track">
              <div className="scale-labels">
                <span>POOR</span>
                <span>CRITICAL</span>
              </div>
              <div className="scale-bar"><div className="fill"></div></div>
            </div>
            <button className="btn-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span className="legend-title">AQI LEGEND</span>
          <div className="legend-colors">
            <div className="color-swatch" style={{backgroundColor: '#2563eb'}}></div>
            <div className="color-swatch" style={{backgroundColor: '#3b82f6'}}></div>
            <div className="color-swatch" style={{backgroundColor: '#eab308'}}></div>
            <div className="color-swatch" style={{backgroundColor: '#d97706'}}></div>
            <div className="color-swatch" style={{backgroundColor: '#dc2626'}}></div>
          </div>
          <div className="legend-range">
            <span>0</span>
            <span>300+</span>
          </div>
        </div>
      </main>
    </>
  );
}
