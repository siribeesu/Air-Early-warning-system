import os
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Default API URL for OpenWeatherMap Air Pollution API
API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')
LAT, LON = 40.7128, -74.0060 # Default to NY

def fetch_real_data(lat, lon, start_time, end_time):
    """
    Fetches historical air quality data from OpenWeatherMap API.
    Requires an API key with historical data access.
    """
    if not API_KEY:
        print("Warning: No OPENWEATHER_API_KEY found. Generating synthetic continuous data...")
        return generate_synthetic_data()

    url = f"http://api.openweathermap.org/data/2.5/air_pollution/history?lat={lat}&lon={lon}&start={start_time}&end={end_time}&appid={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        records = []
        for item in data.get('list', []):
            components = item['components']
            record = {
                'timestamp': item['dt'],
                'aqi': item['main']['aqi'],
                'pm25': components.get('pm2_5', 0),
                'pm10': components.get('pm10', 0),
                'no2': components.get('no2', 0),
                'co': components.get('co', 0),
                'o3': components.get('o3', 0),
                'so2': components.get('so2', 0),
                # Weather variables would be fetched from a parallel weather API usually
                'temp': 290.0,
                'humidity': 50,
                'wind_speed': 3.5
            }
            records.append(record)
        return pd.DataFrame(records)
    else:
        print(f"Failed to fetch data: {response.text}. Using synthetic data instead.")
        return generate_synthetic_data()

def generate_synthetic_data():
    """
    Generates 3 months of synthetic hourly air quality & weather data for training.
    Injects daily cyclical patterns and random variance.
    """
    print("Generating synthetic historical data for ML training...")
    records = []
    
    # 90 days of hourly data = 2160 hours
    start_time = datetime.now() - timedelta(days=90)
    
    # Base starting metrics
    current_pm25 = 15.0
    current_temp = 20.0 # Celsius
    
    for i in range(2160):
        current_date = start_time + timedelta(hours=i)
        hour = current_date.hour
        
        # Traffic rush hours tend to peak NO2 and PM2.5 (8 AM, 6 PM)
        rush_hour_factor = 2 if hour in [8, 9, 17, 18, 19] else 1
        
        # Diurnal temperature cycle
        temp = 15 + 10 * np.sin(np.pi * (hour - 6) / 12.0) + np.random.normal(0, 1)
        humidity = 80 - 2 * temp + np.random.normal(0, 5)
        wind_speed = max(0, 5 + np.random.normal(0, 2))
        
        # Pollutants fluctuate with traffic and inversely with wind speed (wind blows pollution away)
        pm25 = max(5, current_pm25 * 0.9 + 5 * rush_hour_factor - 0.5 * wind_speed + np.random.normal(0, 2))
        current_pm25 = pm25 # carry over slightly
        
        pm10 = pm25 * 1.5 + np.random.normal(0, 3)
        no2 = max(5, 10 * rush_hour_factor + np.random.normal(0, 2))
        co = max(100, 200 * rush_hour_factor + np.random.normal(0, 20))
        
        # Ozone is higher when sunny and hot afternoon
        o3 = max(10, 5 + temp * 1.5 + np.random.normal(0, 4))
        
        # Base AQI conversion formula simulation
        aqi_base = max(pm25/12 * 50, o3/54 * 50, no2/50 * 50) 
        aqi = int(min(500, max(10, aqi_base + np.random.normal(0, 5))))
        
        record = {
            'timestamp': int(current_date.timestamp()),
            'datetime': current_date.strftime('%Y-%m-%d %H:%M:%S'),
            'pm25': round(pm25, 2),
            'pm10': round(pm10, 2),
            'no2': round(no2, 2),
            'co': round(co, 2),
            'o3': round(o3, 2),
            'temp': round(temp, 2),
            'humidity': round(humidity, 2),
            'wind_speed': round(wind_speed, 2),
            'aqi': aqi
        }
        records.append(record)
        
    return pd.DataFrame(records)

def clean_and_prepare_data(df):
    """
    Creates lag features to help the model learn the time-series trajectory.
    """
    df = df.sort_values('timestamp')
    
    # Target variable: AQI 6 hours from current time
    # This prepares the data to "Predict the AQI 6 hours into the future"
    df['target_aqi_6h'] = df['aqi'].shift(-6)
    
    # Lag features (what was the AQI 1h ago, 2h ago)
    df['aqi_lag_1'] = df['aqi'].shift(1)
    df['aqi_lag_2'] = df['aqi'].shift(2)
    
    # Drop NaNs that resulted from shifting
    df = df.dropna()
    
    return df

def get_training_dataset():
    # End time is now, start time is 90 days ago
    end_time = int(datetime.now().timestamp())
    start_time = int((datetime.now() - timedelta(days=90)).timestamp())
    
    df = fetch_real_data(LAT, LON, start_time, end_time)
    df_clean = clean_and_prepare_data(df)
    
    if not os.path.exists('data'):
        os.makedirs('data')
    df_clean.to_csv('data/historical_aqi.csv', index=False)
    print("Dataset saved to data/historical_aqi.csv")
    
    return df_clean

if __name__ == '__main__':
    get_training_dataset()
