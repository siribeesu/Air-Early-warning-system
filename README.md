# Aura Intelligence: AI-Powered Air Quality Early Warning System

![Aura Intelligence Banner](frontend/src/assets/banner_placeholder.png) 

Aura Intelligence is a state-of-the-art, three-tier application designed to monitor, analyze, and predict air quality metrics using machine learning and real-time satellite data. It provides an immersive dashboard for citizens and observers to track atmospheric health and receive early warnings about pollution spikes.

## 🌟 Key Features

- **Dynamic AQI Dashboard**: Real-time monitoring of PM2.5, PM10, NO2, and Ozone.
- **AI Predictive Engine**: Uses a Scikit-Learn pipeline to project air quality trends 6 hours into the future.
- **Interactive Heatmap**: Visualizes pollution density across geographic regions using Leaflet.
- **Atmospheric Forecasts**: Multi-day outlooks driven by meteorological data.
- **Early Warning System**: Configurable alerts for critical pollution levels.
- **Deployment Ready**: Fully containerized with Docker and Docker Compose.

## 🏗️ Architecture

- **Frontend**: React.js with Vite, styled with modern Vanilla CSS (Glassmorphism).
- **Primary Backend**: Node.js & Express (General API & Health checks).
- **ML Backend**: Python & Flask (Machine Learning inference and OpenWeather integration).
- **Database/Storage**: Scalable mock models with support for enterprise integration.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose **OR**
- Node.js (v18+), Python (3.9+), and an [OpenWeather API Key](https://openweathermap.org/api).

### Using Docker (One-Click)
1. Clone the repository.
2. Create a `.env` file in the `ml-backend` directory and add `OPENWEATHER_API_KEY=your_key`.
3. Run:
   ```bash
   docker-compose up --build
   ```

### Manual Setup
Refer to the individual `README.md` files in `frontend/`, `backend/`, and `ml-backend/` for detailed local setup instructions.

## 🛠️ Deployment

The project is deployment-ready with:
- Multi-stage Docker builds.
- Environment variable support for all API URLs.
- Production-grade security headers (Helmet) and CORS policies.

## 📄 License

This project is licensed under the ISC License.

---
Developed with ❤️ for a cleaner planet.
