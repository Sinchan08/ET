// FILE: app/api/predictions/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

// This GET function is correct and stays the same.
export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM data_records ORDER BY record_date DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error fetching records:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

// --- THIS IS THE FIXED POST FUNCTION ---
export async function POST(request: Request) {
  try {
    
    // We select all the feature columns our model needs
    const { rows: dataToPredict } = await db.query(
      `SELECT 
        id, "Consumption", "Voltage", "Current", "Power Factor", 
        "Bill_to_usage_ratio", "delta_units", "rolling_avg", "rolling_min", 
        "rolling_max", "rolling_std", "interaction_billing_pf", "month_sin", "month_cos"
       FROM data_records 
       WHERE is_anomaly = FALSE`
    );

    if (!dataToPredict || dataToPredict.length === 0) {
      return NextResponse.json({ error: 'No new data to predict.' }, { status: 400 });
    }

    // 2. Call ML Service
    const mlResponse = await fetch(`${process.env.ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToPredict),
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error("ML Service Error:", errorText);
      throw new Error(`ML service failed: ${errorText}`);
    }

    const predictions = await mlResponse.json();

    // 3. FIX: Update the database using db.query() directly
    let anomalies_found = 0;
    
    const updatePromises = predictions.map((prediction: any) => {
      if (prediction.is_anomaly) {
        anomalies_found++;
      }
      return db.query(
        'UPDATE data_records SET is_anomaly = $1, confidence = $2 WHERE id = $3',
        [prediction.is_anomaly, prediction.confidence, prediction.id]
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Prediction successful',
      total_records: dataToPredict.length,
      anomalies_found: anomalies_found,
    });

  } catch (error) {
    console.error('Prediction API Error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}