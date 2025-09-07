/*import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Mock ML model prediction
    // In a real implementation, you would:
    // 1. Load the XGBoost model from electricity_theft_detector_xgb.pkl
    // 2. Preprocess the input data
    // 3. Run predictions
    // 4. Return results with confidence scores

    const predictions = data.map((record: any, index: number) => {
      const isAnomaly = Math.random() > 0.7 // Mock prediction
      const confidence = Math.random() * 0.3 + 0.7 // Mock confidence

      return {
        ...record,
        is_anomaly: isAnomaly ? 1 : 0,
        confidence: confidence,
        anomaly_type: isAnomaly
          ? ["Consumption Spike", "Voltage Anomaly", "Power Factor Issue"][Math.floor(Math.random() * 3)]
          : "Normal",
        risk_level: isAnomaly ? ["low", "medium", "high"][Math.floor(Math.random() * 3)] : "low",
      }
    })

    return NextResponse.json({
      success: true,
      predictions,
      summary: {
        total: predictions.length,
        anomalies: predictions.filter((p: any) => p.is_anomaly === 1).length,
        normal: predictions.filter((p: any) => p.is_anomaly === 0).length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 })
  }
}
*/

// app/api/predictions/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Import our database utility

export async function POST(request: Request) {
  try {
    // 1. Get the records from the frontend/database that we need to predict
    const dataToPredict = await request.json();
    
    if (!dataToPredict || dataToPredict.length === 0) {
      return NextResponse.json({ error: 'No data provided for prediction' }, { status: 400 });
    }

    // 2. Call the Python Flask ML service
    const mlResponse = await fetch('http://127.0.0.1:5001/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToPredict),
    });

    if (!mlResponse.ok) {
      // If the ML service gives an error, we send it back
      const errorBody = await mlResponse.json();
      throw new Error(errorBody.error || 'ML service failed');
    }

    const { predictions } = await mlResponse.json();

    // 3. Save the prediction results back into our PostgreSQL database
    for (const p of predictions) {
      const query = `
        UPDATE data_records
        SET is_anomaly = $1, confidence = $2, anomaly_type = $3
        WHERE id = $4;
      `;
      
      // Basic logic to determine anomaly type from the prediction
      const anomaly_type = p.is_anomaly ? 'Predicted Anomaly' : 'Normal';

      await db.query(query, [p.is_anomaly, p.confidence, anomaly_type, p.id]);
    }
    
    // 4. Send the predictions back to the frontend to display
    return NextResponse.json({ predictions });

  } catch (error) {
    console.error('Prediction API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}