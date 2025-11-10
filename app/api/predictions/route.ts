// FILE: app/api/predictions/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

// --- DEFINE A TYPE FOR OUR RULES ---
interface RuleConfig {
  spike_multiplier: number
  voltage_min: number
  voltage_max: number
  power_factor_min: number
  billing_threshold: number
  enabled: boolean
}

// --- THIS IS THE FIXED POST FUNCTION ---
export async function POST(request: Request) {
  try {
    
    // --- 1. FETCH RULES FROM DATABASE ---
    // First, get the rules you saved in the admin panel
    const rulesResponse = await db.query('SELECT * FROM rule_settings WHERE id = 1');
    if (rulesResponse.rows.length === 0) {
      throw new Error('Rule settings not found in database.');
    }
    const rules: RuleConfig = {
      spike_multiplier: parseFloat(rulesResponse.rows[0].spike_multiplier),
      voltage_min: parseFloat(rulesResponse.rows[0].voltage_min),
      voltage_max: parseFloat(rulesResponse.rows[0].voltage_max),
      power_factor_min: parseFloat(rulesResponse.rows[0].power_factor_min),
      billing_threshold: parseFloat(rulesResponse.rows[0].billing_threshold),
      enabled: rulesResponse.rows[0].enabled,
    };

    // --- 2. FETCH DATA TO PREDICT ---
    // Get all records that are not already anomalies.
    // We need all columns for both the rules and the ML model.
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

    // --- 3. CALL ML SERVICE (Same as before) ---
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

    const mlPredictions: {id: number, is_anomaly: boolean, confidence: number}[] = await mlResponse.json();

    // --- 4. RUN RULE ENGINE ---
    // Create a Map to store rule-based breaches (e.g., { 101 => true })
    const ruleBreaches = new Map<number, boolean>();
    
    if (rules.enabled) {
      for (const record of dataToPredict) {
        let breach = false;
        
        // Get numeric values from the record
        const voltage = parseFloat(record.Voltage);
        const powerFactor = parseFloat(record["Power Factor"]);
        const consumption = parseFloat(record.Consumption);
        const rollingAvg = parseFloat(record.rolling_avg);
        const billing = consumption * 10; // Simple billing estimation

        // Check each rule
        if (voltage < rules.voltage_min) breach = true;
        if (voltage > rules.voltage_max) breach = true;
        if (powerFactor < rules.power_factor_min) breach = true;
        if (rollingAvg > 0 && (consumption > (rollingAvg * rules.spike_multiplier))) breach = true;
        if (billing > rules.billing_threshold) breach = true;
        
        if (breach) {
          ruleBreaches.set(record.id, true);
        }
      }
    }

    // --- 5. COMBINE RESULTS & UPDATE DATABASE ---
    let anomalies_found = 0;
    
    // Create a map of ML predictions for easy lookup
    const mlPredictionMap = new Map(mlPredictions.map(p => [p.id, p]));

    const updatePromises = dataToPredict.map((record) => {
      const mlPrediction = mlPredictionMap.get(record.id);
      
      const mlFlagged = mlPrediction?.is_anomaly || false;
      const mlConfidence = mlPrediction?.confidence || 0;
      
      const ruleFlagged = ruleBreaches.has(record.id);

      // Final decision: Flag if EITHER the ML model OR the rules flagged it
      const final_is_anomaly = mlFlagged || ruleFlagged;

      if (final_is_anomaly) {
        anomalies_found++;
      }
      
      // If rule-flagged, set confidence to 1.0 (since rules are 100% certain)
      // Otherwise, use the ML model's confidence
      const final_confidence = ruleFlagged ? 1.0 : mlConfidence;

      return db.query(
        'UPDATE data_records SET is_anomaly = $1, confidence = $2 WHERE id = $3',
        [final_is_anomaly, final_confidence, record.id]
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Prediction successful',
      total_records: dataToPredict.length,
      anomalies_found: anomalies_found,
      rules_applied: rules.enabled,
      rules_breached: ruleBreaches.size
    });

  } catch (error) {
    console.error('Prediction API Error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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