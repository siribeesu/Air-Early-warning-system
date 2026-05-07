import os
import requests
import joblib
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from utils.aqi_logic import (
    generate_health_tip, check_for_alerts, get_aqi_category,
    generate_daily_guide, get_emission_sources, generate_long_term_projection
)

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
allowed_origins = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

GNEWS_API_KEY    = os.environ.get('GNEWS_API_KEY')
PURPLEAIR_API_KEY = os.environ.get('PURPLEAIR_API_KEY')

MODEL_PATH = 'model/aqi_model.pkl'
if os.path.exists(MODEL_PATH):
    print("Loading Air Predictive Pipeline Model from disk...")
    aqi_model = joblib.load(MODEL_PATH)
else:
    print(f"Warning: Predictive Model not found at '{MODEL_PATH}'. Prediction functionality will be limited.")
    aqi_model = None

MOCK_CURRENT = {
    "aqi": 82, "pm25": 14.2, "pm10": 28.5, "no2": 15.6, "co": 320,
    "o3": 42.1, "temp": 24.5, "humidity": 65, "wind_speed": 4.1
}


def fetch_weather_and_pollution(city):
    """Fetches real-time weather + air quality data from Open-Meteo (no API key needed)."""
    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
    geo_res = requests.get(geo_url, timeout=10).json()

    if not geo_res.get('results'):
        raise ValueError(f"City '{city}' could not be located geographically.")

    res0 = geo_res['results'][0]
    lat, lon = res0['latitude'], res0['longitude']
    country  = res0.get('country', '')
    admin1   = res0.get('admin1', '')
    display_name = f"{res0['name']}, {admin1 or country}".strip(', ')

    weather_url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
    )
    aq_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={lat}&longitude={lon}"
        f"&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
    )

    w_res = requests.get(weather_url, timeout=10).json()
    a_res = requests.get(aq_url, timeout=10).json()

    if 'current' not in w_res or 'current' not in a_res:
        raise ValueError("Meteorological data unavailable for this location.")

    w_curr = w_res['current']
    a_curr = a_res['current']

    return {
        "aqi":           a_curr.get('us_aqi', 50),
        "pm25":          a_curr.get('pm2_5', 0),
        "pm10":          a_curr.get('pm10', 0),
        "no2":           a_curr.get('nitrogen_dioxide', 0),
        "co":            a_curr.get('carbon_monoxide', 0),
        "o3":            a_curr.get('ozone', 0),
        "so2":           a_curr.get('sulphur_dioxide', 0),
        "temp":          w_curr.get('temperature_2m', 20),
        "humidity":      w_curr.get('relative_humidity_2m', 50),
        "wind_speed":    w_curr.get('wind_speed_10m', 0),
        "location_name": display_name,
        "country":       country,
        "lat":           lat,
        "lon":           lon,
        "timestamp":     datetime.now().isoformat()
    }


def fetch_aqi_forecast(lat, lon):
    """
    Fetches 7-day hourly AQI + daily weather forecast from Open-Meteo.
    Uses past_days=1 to retrieve the previous two hourly AQI values needed
    as lag features for the ML model.
    """
    aq_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={lat}&longitude={lon}"
        f"&hourly=us_aqi&past_days=1&forecast_days=7"
    )
    weather_daily_url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&daily=temperature_2m_max,precipitation_sum&forecast_days=7&timezone=auto"
    )

    result = {"hourly": [], "daily": [], "past_aqi_1h": None, "past_aqi_2h": None}

    try:
        aq_res = requests.get(aq_url, timeout=12).json()
        if 'hourly' not in aq_res:
            return result

        times = aq_res['hourly']['time']
        aqis  = aq_res['hourly']['us_aqi']

        # Locate the current hour in the series
        now = datetime.now()
        current_hour_prefix = now.strftime('%Y-%m-%dT%H')
        current_idx = None
        for i, t in enumerate(times):
            if t.startswith(current_hour_prefix):
                current_idx = i
                break
        if current_idx is None:
            current_idx = 24  # Fallback: skip past_days block

        # Extract real lag features (actual past AQI 1h and 2h ago)
        if current_idx >= 1 and aqis[current_idx - 1] is not None:
            result["past_aqi_1h"] = float(aqis[current_idx - 1])
        if current_idx >= 2 and aqis[current_idx - 2] is not None:
            result["past_aqi_2h"] = float(aqis[current_idx - 2])

        # Hourly forecast: next 24 hours from current time
        forecast_hourly = []
        for i in range(current_idx, min(current_idx + 24, len(times))):
            if aqis[i] is not None:
                dt = datetime.fromisoformat(times[i])
                forecast_hourly.append({
                    "time":  dt.strftime('%H:%M'),
                    "aqi":   int(aqis[i]),
                    "hour":  dt.hour
                })
        result["hourly"] = forecast_hourly

        # Daily aggregates from today for 7 days
        daily_map = {}
        for i in range(current_idx, len(times)):
            if aqis[i] is None:
                continue
            dt       = datetime.fromisoformat(times[i])
            date_str = dt.strftime('%Y-%m-%d')
            if date_str not in daily_map:
                daily_map[date_str] = {"aqis": [], "day": dt.strftime('%a'), "date": date_str}
            daily_map[date_str]["aqis"].append(aqis[i])

        # Enrich with weather forecast (temp + precipitation)
        weather_daily = {}
        try:
            w_res = requests.get(weather_daily_url, timeout=8).json()
            if 'daily' in w_res:
                wd = w_res['daily']
                for j, d in enumerate(wd.get('time', [])):
                    weather_daily[d] = {
                        "temp_max": wd['temperature_2m_max'][j],
                        "precip":   wd['precipitation_sum'][j]
                    }
        except Exception:
            pass

        forecast_daily = []
        for date_str, info in daily_map.items():
            if info["aqis"]:
                avg_aqi = round(sum(info["aqis"]) / len(info["aqis"]))
                entry   = {
                    "day":      info["day"],
                    "date":     date_str,
                    "aqi":      avg_aqi,
                    "temp_max": None,
                    "precip":   None
                }
                if date_str in weather_daily:
                    entry["temp_max"] = weather_daily[date_str]["temp_max"]
                    raw_precip        = weather_daily[date_str]["precip"]
                    entry["precip"]   = round(raw_precip, 1) if raw_precip is not None else None
                forecast_daily.append(entry)

        result["daily"] = forecast_daily

    except Exception as e:
        print(f"Forecast fetch error: {e}")

    return result


def fetch_local_news(city):
    """Fetches environment/AQI news for the city via GNews API."""
    if not GNEWS_API_KEY:
        return []

    queries = [
        f'"{city}" AND ("air quality" OR "air pollution" OR "smog")',
        f'"{city}" AND ("particulate matter" OR "PM2.5" OR "emissions")'
    ]

    seen_urls    = set()
    all_articles = []

    for query in queries:
        url = f"https://gnews.io/api/v4/search?q={query}&lang=en&max=5&apikey={GNEWS_API_KEY}"
        try:
            data     = requests.get(url, timeout=8).json()
            articles = data.get('articles', [])
            for art in articles:
                if not art.get('url') or art['url'] in seen_urls:
                    continue
                title       = str(art.get('title') or "")
                description = str(art.get('description') or "")
                text        = (title + " " + description).lower()
                keywords    = ["air", "pollution", "smog", "aqi", "emission", "particulate", "pm2.5", "pm10", "ozone", "no2"]
                if any(kw in text for kw in keywords):
                    all_articles.append({
                        "title":       title,
                        "description": description,
                        "url":         art['url'],
                        "source":      art.get('source', {}).get('name', 'Environmental News'),
                        "image":       art.get('image'),
                        "publishedAt": art.get('publishedAt')
                    })
                    seen_urls.add(art['url'])
            if len(all_articles) >= 3:
                break
        except Exception as e:
            print(f"GNews Error: {e}")
            continue

    if all_articles:
        return all_articles[:3]

    # Fallback: general air pollution news
    fallback_url = (
        f'https://gnews.io/api/v4/search?q="air quality" OR "air pollution" OR "smog"'
        f'&lang=en&max=3&apikey={GNEWS_API_KEY}'
    )
    try:
        data     = requests.get(fallback_url, timeout=8).json()
        articles = data.get('articles', [])
        return [{
            "title":       art.get('title', ''),
            "description": art.get('description', ''),
            "url":         art.get('url', '#'),
            "source":      art.get('source', {}).get('name', 'Environmental News'),
            "image":       art.get('image'),
            "publishedAt": art.get('publishedAt')
        } for art in articles]
    except Exception:
        return []


def fetch_purpleair_data(lat, lon):
    """Fetches hyper-local PM2.5 readings from the PurpleAir sensor network."""
    if not PURPLEAIR_API_KEY:
        return None

    try:
        nw_lat = round(float(lat) + 0.45, 4)
        se_lat = round(float(lat) - 0.45, 4)
        nw_lon = round(float(lon) - 0.45, 4)
        se_lon = round(float(lon) + 0.45, 4)

        params  = {
            "fields": "pm2.5_atm",
            "nwlat": str(nw_lat), "selat": str(se_lat),
            "nwlon": str(nw_lon), "selon": str(se_lon),
        }
        headers = {"X-API-Key": PURPLEAIR_API_KEY.strip()}
        res     = requests.get("https://api.purpleair.com/v1/sensors", headers=headers, params=params, timeout=10)

        if res.status_code != 200:
            return {
                "provider":     "PurpleAir (Simulated)",
                "sensor_count": 5,
                "avg_pm25":     14.2,
                "note":         f"API returned {res.status_code}. Using regional simulation."
            }

        data    = res.json()
        sensors = data.get('data', [])

        if not sensors:
            return {
                "provider":     "PurpleAir Network",
                "sensor_count": 0,
                "avg_pm25":     None,
                "note":         "No neighborhood sensors detected within this regional grid."
            }

        fields   = data.get('fields', [])
        pm25_idx = fields.index('pm2.5_atm') if 'pm2.5_atm' in fields else -1
        if pm25_idx == -1:
            return None

        pm25_values = [s[pm25_idx] for s in sensors if s[pm25_idx] is not None]
        if not pm25_values:
            return {
                "provider":     "PurpleAir Network",
                "sensor_count": len(sensors),
                "avg_pm25":     None,
                "note":         f"Found {len(sensors)} sensors, but none are reporting active data."
            }

        avg_pm25 = sum(pm25_values) / len(pm25_values)
        return {
            "provider":     "PurpleAir Network",
            "sensor_count": len(sensors),
            "avg_pm25":     round(avg_pm25, 1),
            "note":         f"Synthesis of {len(sensors)} regional neighbourhood sensors."
        }

    except Exception as e:
        print(f"PurpleAir Error: {e}")
        return None


def _build_directive(aqi, daily_guide, components):
    """Constructs the top-level directive object used by the Alerts view."""
    if aqi <= 100 or not daily_guide:
        return None

    first = daily_guide[0]
    pm25  = components.get('pm25', 0) or 0
    no2   = components.get('no2', 0) or 0
    o3    = components.get('o3', 0) or 0

    if pm25 > 35:
        primary_driver = f"PM2.5 Fine Particulate Matter ({round(pm25, 1)} µg/m³)"
    elif no2 > 40:
        primary_driver = f"Nitrogen Dioxide — Traffic Emissions ({round(no2, 1)} ppb)"
    elif o3 > 70:
        primary_driver = f"Ground-Level Ozone ({round(o3, 1)} ppb)"
    else:
        primary_driver = f"General AQI Elevation ({aqi} — {get_aqi_category(aqi)})"

    return {
        "action":         first["title"],
        "reason":         first["text"],
        "primary_driver": primary_driver
    }


@app.route('/api/aqi', methods=['GET'])
def get_current_aqi():
    location = request.args.get('location', '').strip()

    if location:
        try:
            data          = fetch_weather_and_pollution(location)
            location_name = data.get('location_name', location)

            # Fetch forecast once and reuse for both the forecast field and projection
            forecast_data = fetch_aqi_forecast(data['lat'], data['lon'])

            # Use real lag features from past hourly AQI
            past_aqi_1h = forecast_data.get('past_aqi_1h') or data['aqi']
            past_aqi_2h = forecast_data.get('past_aqi_2h') or data['aqi']

            predicted_aqi = None
            alerts        = []

            if aqi_model is not None:
                features = {
                    'pm25':        [data['pm25']],
                    'pm10':        [data['pm10']],
                    'no2':         [data['no2']],
                    'co':          [data['co']],
                    'o3':          [data['o3']],
                    'temp':        [data['temp']],
                    'humidity':    [data['humidity']],
                    'wind_speed':  [data['wind_speed']],
                    'aqi':         [data['aqi']],
                    'aqi_lag_1':   [past_aqi_1h],
                    'aqi_lag_2':   [past_aqi_2h]
                }
                df_inputs     = pd.DataFrame(features)
                predicted_aqi = float(aqi_model.predict(df_inputs)[0])
                predicted_aqi = max(0.0, round(predicted_aqi, 1))
                data['predicted_aqi_6h'] = predicted_aqi
                alerts = check_for_alerts(predicted_aqi, data['aqi'])

            # Region-aware AI outputs (pass location + components)
            health_tip_obj = generate_health_tip(data['aqi'], data, location_name)
            daily_guide    = generate_daily_guide(data['aqi'], data, location_name)
            directive      = _build_directive(data['aqi'], daily_guide, data)

            return jsonify({
                "status":           "success",
                "data":             data,
                "category":         get_aqi_category(data["aqi"]),
                "alerts":           alerts,
                "health_tip":       health_tip_obj["recommendation"],
                "daily_guide":      daily_guide,
                "directive":        directive,
                "emission_sources": get_emission_sources(data["aqi"], data),
                "forecast":         forecast_data,
                "news":             fetch_local_news(location),
                "hyperlocal":       fetch_purpleair_data(data['lat'], data['lon']),
                "projection":       generate_long_term_projection(data["aqi"], data, forecast_data, location_name)
            })

        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    # ── Fallback (no location provided) ──────────────────────────────────────
    mock_health = generate_health_tip(MOCK_CURRENT["aqi"], MOCK_CURRENT, "")
    mock_guide  = generate_daily_guide(MOCK_CURRENT["aqi"], MOCK_CURRENT, "")

    return jsonify({
        "status":    "success",
        "timestamp": pd.Timestamp.now().isoformat(),
        "location":  "Local Observatory",
        "data":      MOCK_CURRENT,
        "category":  get_aqi_category(MOCK_CURRENT["aqi"]),
        "alerts":    [],
        "health_tip": "Fallback data active — please provide a location parameter for live readings.",
        "daily_guide": mock_guide,
        "directive":  None,
        "emission_sources": {
            "breakdown": [
                {"name": "TRANSPORTATION", "value": 45, "color": "var(--primary-color)"},
                {"name": "INDUSTRIAL",     "value": 30, "color": "#6366f1"},
                {"name": "CONSTRUCTION",   "value": 15, "color": "#10b981"},
                {"name": "OTHERS",         "value": 10, "color": "#f59e0b"}
            ],
            "note": "Mock data active. Showing typical urban emission breakdown."
        },
        "forecast": {
            "hourly": [
                {"time": f"{(i * 2) % 24:02}:00", "aqi": 50 + (i * 5), "hour": (i * 2) % 24}
                for i in range(12)
            ],
            "daily": [
                {"day": "Mon", "date": "", "aqi": 65, "temp_max": None, "precip": None},
                {"day": "Tue", "date": "", "aqi": 70, "temp_max": None, "precip": None},
                {"day": "Wed", "date": "", "aqi": 75, "temp_max": None, "precip": None}
            ],
            "past_aqi_1h": None,
            "past_aqi_2h": None
        },
        "news": [{
            "title":       "Air Quality Improvements Noted in Urban Centres",
            "description": "Recent data suggests a decline in nitrogen dioxide levels as public transit electrifies.",
            "url":         "#",
            "source":      "Environmental Weekly",
            "image":       None,
            "publishedAt": "2024-05-01T10:00:00Z"
        }],
        "hyperlocal": {
            "provider":     "PurpleAir Network",
            "sensor_count": 4,
            "avg_pm25":     12.5,
            "note":         "Localised neighbourhood sensors reporting slightly lower levels than the main station."
        },
        "projection": {
            "milestones": [
                {"period": "1 Month",  "aqi": 85,  "status": "Safe"},
                {"period": "3 Months", "aqi": 110, "status": "Poor"},
                {"period": "6 Months", "aqi": 160, "status": "Poor"},
                {"period": "1 Year",   "aqi": 220, "status": "Toxic"}
            ],
            "days_to_spoiled":    240,
            "growth_ratio":       "4.2%",
            "tipping_point_desc": "Critical threshold (AQI 200) projected in ~240 days",
            "risk_level":         "Moderate"
        }
    })


if __name__ == '__main__':
    port  = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
