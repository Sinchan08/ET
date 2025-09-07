# ml-service/ml_api.py

from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import pickle
import xgboost # Required for pickle to load the model

app = Flask(__name__)

# Load the trained XGBoost model
try:
    with open('electricity_theft_detector_xgb.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ Model loaded successfully.")
except FileNotFoundError:
    model = None
    print("❌ ERROR: Model file not found! Make sure 'electricity_theft_detector_xgb.pkl' is in the 'ml-service' folder.")

# This function replicates the feature engineering from your training scripts
def engineer_features_for_prediction(df):
    # Ensure data types are correct
    df['Consumption'] = pd.to_numeric(df['consumption'], errors='coerce').fillna(0)
    df['Voltage'] = pd.to_numeric(df['voltage'], errors='coerce')
    df['Current'] = pd.to_numeric(df.get('current', 0), errors='coerce') # Handle optional 'current'
    df['Power Factor'] = pd.to_numeric(df.get('power_factor', 1.0), errors='coerce')
    df['Billing Amount'] = pd.to_numeric(df.get('billing_amount', df['Consumption'] * 5), errors='coerce') # Estimate if missing
    df['Total'] = pd.to_numeric(df.get('total', df['Billing Amount']), errors='coerce')
    
    # Fill missing Voltage with the median
    df['Voltage'] = df['Voltage'].fillna(df['Voltage'].median())

    # Create date features
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by=['rrno', 'date'])
    
    # --- Start Feature Engineering ---
    df['month_sin'] = np.sin(2 * np.pi * df['date'].dt.month / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['date'].dt.month / 12)
    
    # Interaction features
    df['Bill_to_usage_ratio'] = (df['Total'] / df['Consumption']).replace([np.inf, -np.inf], 0).fillna(0)
    df['interaction_billing_pf'] = df['Billing Amount'] * df['Power Factor']

    # Group by RRNO to calculate rolling stats and diffs
    all_groups = []
    for rrno, group in df.groupby('rrno'):
        group = group.copy()
        group['rolling_avg'] = group['Consumption'].rolling(3, min_periods=1).mean()
        group['rolling_min'] = group['Consumption'].rolling(3, min_periods=1).min()
        group['rolling_max'] = group['Consumption'].rolling(3, min_periods=1).max()
        group['rolling_std'] = group['Consumption'].rolling(3, min_periods=1).std().fillna(0)
        group['delta_units'] = group['Consumption'].diff().fillna(0)
        all_groups.append(group)
        
    if not all_groups:
        return pd.DataFrame() # Return empty if no data

    processed_df = pd.concat(all_groups)
    return processed_df

@app.route("/predict", methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.get_json()
    df = pd.DataFrame(data)

    # Apply the feature engineering
    processed_df = engineer_features_for_prediction(df)

    if processed_df.empty:
        return jsonify({"predictions": []})

    # The final list of features MUST match the list used during training
    final_features = [
        'Consumption', 'Voltage', 'Current', 'Power Factor', 'Bill_to_usage_ratio',
        'delta_units', 'rolling_avg', 'rolling_min', 'rolling_max', 'rolling_std',
        'interaction_billing_pf', 'month_sin', 'month_cos'
    ]

    # Ensure all required columns exist, fill missing with 0
    for col in final_features:
        if col not in processed_df.columns:
            processed_df[col] = 0
            
    X_predict = processed_df[final_features]

    # Make predictions
    predictions = model.predict(X_predict)
    probabilities = model.predict_proba(X_predict)[:, 1] # Probability of being an anomaly

    # Add results back to the original data's index
    processed_df['is_anomaly'] = [bool(p) for p in predictions]
    processed_df['confidence'] = [float(p) for p in probabilities]
    
    # Return the results in a JSON format
    return jsonify({"predictions": processed_df.to_dict(orient='records')})

if __name__ == '__main__':
    app.run(port=5001, debug=True)