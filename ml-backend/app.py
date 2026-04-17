import os
import requests
import joblib
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from utils.aqi_logic import generate_health_tip, check_for_alerts, get_aqi_category

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
allowed_origins = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

API_KEY = os.environ.get('OPENWEATHER_API_KEY')

MODEL_PATH = 'model/aqi_model.pkl'
if os.path.exists(MODEL_PATH):
    print("Loading AQI Predictive Pipeline Model from disk...")
    aqi_model = joblib.load(MODEL_PATH)
else:
    print(f"Warning: Predictive Model not found at '{MODEL_PATH}'. Alerts functionality will be limited.")
    aqi_model = None

# A mock current status fallback when open APIs are not connected
MOCK_CURRENT = {
    "aqi": 82, "pm25": 14.2, "pm10": 28.5, "no2": 15.6, "co": 320, 
    "o3": 42.1, "temp": 24.5, "humidity": 65, "wind_speed": 4.1
}

def fetch_weather_and_pollution(city):
    """
    Given a city name, fetches robust metadata from OpenWeather APIs.
    """
    if not API_KEY:
        raise ValueError("OPENWEATHER_API_KEY is missing from .env")

    # 1. Geocoding
    geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={API_KEY}"
    geo_res = requests.get(geo_url)
    geo_data = geo_res.json()
    
    if not geo_data or len(geo_data) == 0:
        raise ValueError(f"City '{city}' could not be located geographically.")
        
    lat = geo_data[0]['lat']
    lon = geo_data[0]['lon']
    display_name = f"{geo_data[0]['name']}, {geo_data[0].get('state', geo_data[0].get('country', ''))}".strip(', ')

    # 2. Weather
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={API_KEY}"
    w_res = requests.get(weather_url).json()

    # 3. Air Pollution
    aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
    a_res = requests.get(aqi_url).json()

    if 'list' not in a_res or not a_res['list']:
        raise ValueError("Air pollution data unavailable for this location.")

    # Combine data
    # Map OpenWeather AQI (1-5 scale) to US EPA AQI scale (0-500) roughly
    # OW AQI mapping: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    # We'll use a rough translation if actual EPA formula isn't computed:
    ow_aqi_scale = {1: 25, 2: 75, 3: 125, 4: 175, 5: 250}

    components = a_res['list'][0]['components']
    ow_aqi = a_res['list'][0]['main']['aqi']

    combined = {
        "aqi": ow_aqi_scale.get(ow_aqi, 50), # Approximate EPA AQI
        "pm25": components.get('pm2_5', 0),
        "pm10": components.get('pm10', 0),
        "no2": components.get('no2', 0),
        "co": components.get('co', 0),
        "o3": components.get('o3', 0),
        "temp": w_res['main']['temp'],
        "humidity": w_res['main']['humidity'],
        "wind_speed": w_res['wind']['speed'],
        "location_name": display_name,
        "lat": lat,
        "lon": lon,
        "timestamp": datetime.now().isoformat()
    }
    return combined

@app.route('/api/aqi', methods=['GET'])
def get_current_aqi():
    location = request.args.get('location', '')
    
    if location:
        try:
            data = fetch_weather_and_pollution(location)
            
            # Use the machine learning model to predict what AQI will be in 6 hours
            alerts = []
            predicted_aqi = None
            if aqi_model is not None:
                # Prepare features for ML Model
                features = {
                    'pm25': [data['pm25']], 'pm10': [data['pm10']], 'no2': [data['no2']],
                    'co': [data['co']], 'o3': [data['o3']], 'temp': [data['temp']],
                    'humidity': [data['humidity']], 'wind_speed': [data['wind_speed']],
                    'aqi': [data['aqi']], 'aqi_lag_1': [data['aqi']], 'aqi_lag_2': [data['aqi']]
                }
                df_inputs = pd.DataFrame(features)
                predicted_aqi = float(aqi_model.predict(df_inputs)[0])
                data['predicted_aqi_6h'] = round(predicted_aqi, 1)
                alerts = check_for_alerts(predicted_aqi, data['aqi'])
            
            return jsonify({
                "status": "success",
                "data": data,
                "category": get_aqi_category(data["aqi"]),
                "alerts": alerts,
                "health_tip": generate_health_tip(data["aqi"])["recommendation"]
            })
            
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400
    
    # Fallback if no location provided
    return jsonify({
        "status": "success",
        "timestamp": pd.Timestamp.now().isoformat(),
        "location": "Local Observatory",
        "data": MOCK_CURRENT,
        "category": get_aqi_category(MOCK_CURRENT["aqi"]),
        "alerts": [],
        "health_tip": "Fallback data active. Please provide a location parameter."
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
