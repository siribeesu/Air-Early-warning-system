const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Mock Data Models
const currentAQI = {
  location: "Central Park, NY",
  overall_aqi: 24,
  status: "GOOD",
  pm25: { value: 5.2, status: "Optimal" },
  pm10: { value: 12.8, status: "Optimal" },
  no2: { value: 8.4, status: "Optimal" },
  o3: { value: 32.1, status: "Moderate" },
  timestamp: new Date().toISOString()
};

const forecastData = [
  { day: 'Today', date: 'Oct 24', aqi: 42, condition: 'Good', temp: '72°F', rain: '0%' },
  { day: 'Tomorrow', date: 'Oct 25', aqi: 56, condition: 'Moderate', temp: '68°F', rain: '20%' },
  { day: 'Wednesday', date: 'Oct 26', aqi: 85, condition: 'Moderate', temp: '65°F', rain: '40%' },
  { day: 'Thursday', date: 'Oct 27', aqi: 112, condition: 'Poor', temp: '62°F', rain: '80%' },
  { day: 'Friday', date: 'Oct 28', aqi: 64, condition: 'Moderate', temp: '59°F', rain: '60%' },
  { day: 'Saturday', date: 'Oct 29', aqi: 35, condition: 'Good', temp: '64°F', rain: '10%' },
  { day: 'Sunday', date: 'Oct 30', aqi: 40, condition: 'Good', temp: '68°F', rain: '0%' },
];

const activeAlerts = [
  {
    id: 1,
    type: 'critical',
    title: 'High Particle Density Alert',
    time: 'Just Now',
    description: 'PM2.5 levels in Financial District have exceeded 60 µg/m³. Sensitive groups should avoid extended outdoor exertion.',
    tags: ['San Francisco, CA', 'Action Required']
  },
  {
    id: 2,
    type: 'warning',
    title: 'Ozone Pre-Warning',
    time: '2 hours ago',
    description: 'UV indexes and heat projections indicate elevated O3 levels are highly likely by tomorrow afternoon. Consider rescheduling outdoor runs.',
    tags: ['Bay Area Regional', 'Monitoring']
  },
  {
    id: 3,
    type: 'info',
    title: 'System Update',
    time: '1 day ago',
    description: 'Aura Intelligence has re-calibrated sensors in the West Coast grid. You may notice minor historical data adjustments.',
    tags: []
  }
];

// Routes
app.get('/api/aqi/current', (req, res) => {
  res.json(currentAQI);
});

app.get('/api/forecast', (req, res) => {
  res.json(forecastData);
});

app.get('/api/alerts', (req, res) => {
  res.json(activeAlerts);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Aura Intelligence API v1', status: 'healthy' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Aura Intelligence] Backend running on port ${PORT}`);
});
