import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import xgboost as xgb
import pickle
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

def load_and_preprocess_data(file_path):
    """Load and preprocess the training data"""
    df = pd.read_csv(file_path)
    
    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y')
    
    # Extract date features
    df['month'] = df['date'].dt.month
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['quarter'] = df['date'].dt.quarter
    
    # Feature engineering
    df['consumption_per_voltage'] = df['consumption'] / df['voltage']
    df['power'] = df['voltage'] * df['current'] * df['power_factor']
    df['billing_per_consumption'] = df['billing'] / df['consumption']
    
    # Rolling statistics
    df = df.sort_values(['RRNO', 'date'])
    df['consumption_rolling_mean'] = df.groupby('RRNO')['consumption'].transform(lambda x: x.rolling(window=3, min_periods=1).mean())
    df['consumption_rolling_std'] = df.groupby('RRNO')['consumption'].transform(lambda x: x.rolling(window=3, min_periods=1).std())
    df['consumption_lag1'] = df.groupby('RRNO')['consumption'].shift(1)
    df['consumption_lag2'] = df.groupby('RRNO')['consumption'].shift(2)
    
    # Seasonal features
    season_mapping = {'winter': 0, 'spring': 1, 'summer': 2, 'monsoon': 3}
    df['season_encoded'] = df['season'].map(season_mapping)
    
    # Handle missing values
    df = df.fillna(df.median(numeric_only=True))
    
    return df

def train_model(df):
    """Train the XGBoost model"""
    # Select features
    feature_columns = [
        'consumption', 'voltage', 'current', 'billing', 'power_factor',
        'month', 'day_of_week', 'quarter', 'consumption_per_voltage', 
        'power', 'billing_per_consumption', 'consumption_rolling_mean',
        'consumption_rolling_std', 'consumption_lag1', 'consumption_lag2',
        'season_encoded'
    ]
    
    X = df[feature_columns]
    y = df['is_anomaly']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train XGBoost model with focus on recall (theft detection)
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=3,  # Handle class imbalance
        random_state=42,
        eval_metric='auc'
    )
    
    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_test_scaled, y_test)],
        early_stopping_rounds=20,
        verbose=False
    )
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    # Calculate metrics
    auc_score = roc_auc_score(y_test, y_pred_proba)
    
    print("Model Training Results:")
    print(f"AUC Score: {auc_score:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nTop 10 Most Important Features:")
    print(feature_importance.head(10))
    
    # Save model and scaler
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_filename = f'electricity_theft_detector_xgb_{timestamp}.pkl'
    scaler_filename = f'scaler_{timestamp}.pkl'
    
    with open(model_filename, 'wb') as f:
        pickle.dump(model, f)
    
    with open(scaler_filename, 'wb') as f:
        pickle.dump(scaler, f)
    
    print(f"\nModel saved as: {model_filename}")
    print(f"Scaler saved as: {scaler_filename}")
    
    return {
        'model': model,
        'scaler': scaler,
        'auc_score': auc_score,
        'feature_importance': feature_importance,
        'test_predictions': y_pred,
        'test_probabilities': y_pred_proba,
        'test_labels': y_test
    }

def retrain_model(new_data_file, existing_model_file=None):
    """Retrain the model with new data"""
    print("Starting model retraining...")
    
    # Load new data
    df = load_and_preprocess_data(new_data_file)
    
    # If existing model provided, we could implement incremental learning
    # For now, we'll retrain from scratch
    results = train_model(df)
    
    print("Model retraining completed!")
    return results

if __name__ == "__main__":
    # Example usage
    print("Training electricity theft detection model...")
    df = load_and_preprocess_data('processed_theft_dataset.csv')
    results = train_model(df)
    
    print(f"\nTraining completed with AUC score: {results['auc_score']:.4f}")
