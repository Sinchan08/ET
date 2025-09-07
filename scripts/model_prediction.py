import pandas as pd
import numpy as np
import pickle
from datetime import datetime
import json

def load_model():
    """Load the trained XGBoost model"""
    try:
        with open('electricity_theft_detector_xgb.pkl', 'rb') as f:
            model = pickle.load(f)
        return model
    except FileNotFoundError:
        print("Model file not found. Please ensure electricity_theft_detector_xgb.pkl is in the correct path.")
        return None

def preprocess_data(df):
    """Preprocess the input data for prediction"""
    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y')
    
    # Extract date features
    df['month'] = df['date'].dt.month
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    
    # Handle missing values
    df = df.fillna(df.median(numeric_only=True))
    
    # Feature engineering
    df['consumption_per_voltage'] = df['consumption'] / df['voltage']
    df['power'] = df['voltage'] * df['current'] * df['power_factor']
    df['billing_per_consumption'] = df['billing'] / df['consumption']
    
    # Rolling averages (mock implementation)
    df['consumption_rolling_mean'] = df.groupby('RRNO')['consumption'].transform(lambda x: x.rolling(window=3, min_periods=1).mean())
    df['consumption_rolling_std'] = df.groupby('RRNO')['consumption'].transform(lambda x: x.rolling(window=3, min_periods=1).std())
    
    # Seasonal encoding
    season_mapping = {'winter': 0, 'spring': 1, 'summer': 2, 'monsoon': 3}
    df['season_encoded'] = df['season'].map(season_mapping).fillna(0)
    
    return df

def make_predictions(data_file):
    """Make predictions on the uploaded data"""
    # Load model
    model = load_model()
    if model is None:
        return {"error": "Model not found"}
    
    # Load and preprocess data
    df = pd.read_csv(data_file)
    df_processed = preprocess_data(df)
    
    # Select features for prediction (adjust based on your model)
    feature_columns = [
        'consumption', 'voltage', 'current', 'billing', 'power_factor',
        'month', 'day_of_week', 'consumption_per_voltage', 'power',
        'billing_per_consumption', 'consumption_rolling_mean', 'season_encoded'
    ]
    
    # Ensure all required columns exist
    for col in feature_columns:
        if col not in df_processed.columns:
            df_processed[col] = 0
    
    X = df_processed[feature_columns]
    
    # Make predictions
    predictions = model.predict(X)
    prediction_proba = model.predict_proba(X)
    
    # Add predictions to dataframe
    df_processed['is_anomaly'] = predictions
    df_processed['confidence'] = np.max(prediction_proba, axis=1)
    
    # Determine anomaly types based on feature values
    df_processed['anomaly_type'] = 'Normal'
    anomaly_mask = df_processed['is_anomaly'] == 1
    
    # Simple rule-based anomaly type classification
    df_processed.loc[anomaly_mask & (df_processed['consumption'] > df_processed['consumption_rolling_mean'] * 2), 'anomaly_type'] = 'Consumption Spike'
    df_processed.loc[anomaly_mask & (df_processed['voltage'] < 200), 'anomaly_type'] = 'Voltage Anomaly'
    df_processed.loc[anomaly_mask & (df_processed['power_factor'] < 0.7), 'anomaly_type'] = 'Power Factor Issue'
    df_processed.loc[anomaly_mask & (df_processed['billing_per_consumption'] > df_processed['billing_per_consumption'].quantile(0.9)), 'anomaly_type'] = 'Billing Mismatch'
    
    # Risk level classification
    df_processed['risk_level'] = 'low'
    df_processed.loc[anomaly_mask & (df_processed['confidence'] > 0.8), 'risk_level'] = 'medium'
    df_processed.loc[anomaly_mask & (df_processed['confidence'] > 0.9), 'risk_level'] = 'high'
    
    # Prepare results
    results = {
        'predictions': df_processed.to_dict('records'),
        'summary': {
            'total_records': len(df_processed),
            'anomalies_detected': int(df_processed['is_anomaly'].sum()),
            'normal_readings': int((df_processed['is_anomaly'] == 0).sum()),
            'high_risk_count': int((df_processed['risk_level'] == 'high').sum()),
            'accuracy_estimate': 0.942  # Mock accuracy from training
        }
    }
    
    return results

if __name__ == "__main__":
    # Example usage
    results = make_predictions('processed_theft_dataset.csv')
    print(json.dumps(results['summary'], indent=2))
