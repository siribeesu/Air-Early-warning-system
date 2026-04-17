import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib
from data_collection import get_training_dataset

# The target variable we want to predict is `target_aqi_6h` (AQI 6 hours from now)
# Our features are the current sensor readings, weather, and lagged AQI values
FEATURES = ['pm25', 'pm10', 'no2', 'co', 'o3', 'temp', 'humidity', 'wind_speed', 'aqi', 'aqi_lag_1', 'aqi_lag_2']
TARGET = 'target_aqi_6h'

def train_and_save_model():
    print("Initiating AQI Prediction ML Training Pipeline...")
    
    # 1. Collect and prepare Data
    try:
        if os.path.exists('data/historical_aqi.csv'):
            print("Loading cached dataset...")
            df = pd.read_csv('data/historical_aqi.csv')
        else:
            print("Fetching historical data...")
            df = get_training_dataset()
    except Exception as e:
        print(f"Failed to load data: {e}. Executing explicit data collection routine.")
        df = get_training_dataset()

    if df.empty:
        raise ValueError("Data collection returned an empty dataset. Cannot train model.")
        
    # Ensure correct columns exist
    for col in FEATURES + [TARGET]:
        if col not in df.columns:
            raise KeyError(f"Feature column missing from dataset: {col}")

    # 2. Split into features and target
    X = df[FEATURES]
    y = df[TARGET]

    # Time-series chronologically split (Train on first 80%, Test on last 20%)
    split_index = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_index], X.iloc[split_index:]
    y_train, y_test = y.iloc[:split_index], y.iloc[split_index:]

    # 3. Initialize and Train Model
    print(f"Training Random Forest Regressor on {len(X_train)} historical samples...")
    model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42)
    model.fit(X_train, y_train)

    # 4. Evaluate the model performance
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))

    print("--- Model Evaluation ---")
    print(f"Mean Absolute Error (MAE): {mae:.2f} AQI points")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} AQI points")
    print("------------------------")

    # 5. Export weights and save model
    if not os.path.exists('model'):
        os.makedirs('model')
        
    model_path = 'model/aqi_model.pkl'
    joblib.dump(model, model_path)
    print(f"Success! Optimized Model saved to {model_path}.")

if __name__ == '__main__':
    train_and_save_model()
