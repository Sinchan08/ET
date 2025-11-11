// FILE: app/api/predictions/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import db from '@/lib/db';

const RECORDS_PER_PAGE = 20; // Set how many records to show per page

// --- THE GET FUNCTION IS UPDATED ---
export async function GET(request: NextRequest) {
  try {
    // Get the page number from the URL, e.g., /api/predictions?page=1
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    
    // Calculate the offset for the SQL query
    const offset = (page - 1) * RECORDS_PER_PAGE;

    // Query 1: Get the total count of all records
    const countQuery = db.query('SELECT COUNT(*) FROM data_records');
    
    // Query 2: Get just one page of records
    const dataQuery = db.query(
      `SELECT * FROM data_records 
       ORDER BY record_date DESC 
       LIMIT $1 OFFSET $2`,
      [RECORDS_PER_PAGE, offset]
    );

    // Run both queries in parallel
    const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const records = dataResult.rows;

    return NextResponse.json({
      records,
      totalRecords,
      totalPages: Math.ceil(totalRecords / RECORDS_PER_PAGE)
    });

  } catch (error) {
    console.error('API Error fetching records:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}


// --- THIS POST FUNCTION STAYS EXACTLY THE SAME ---
export async function POST(request: Request) {
  try {
    
    // 1. FETCH RULES FROM DATABASE
    const rulesResponse = await db.query('SELECT * FROM rule_settings WHERE id = 1');
    if (rulesResponse.rows.length === 0) {
      throw new Error('Rule settings not found in database.');
    }
    const rules = {
      spike_multiplier: parseFloat(rulesResponse.rows[0].spike_multiplier),
      voltage_min: parseFloat(rulesResponse.rows[0].voltage_min),
      voltage_max: parseFloat(rulesResponse.rows[0].voltage_max),
      power_factor_min: parseFloat(rulesResponse.rows[0].power_factor_min),
      billing_threshold: parseFloat(rulesResponse.rows[0].billing_threshold),
      enabled: rulesResponse.rows[0].enabled,
    };

    // 2. FETCH DATA TO PREDICT
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

    // 3. CALL ML SERVICE (Same as before)
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

    // 4. RUN RULE ENGINE
    const ruleBreaches = new Map<number, boolean>();
    
    if (rules.enabled) {
      for (const record of dataToPredict) {
        let breach = false;
        
        const voltage = parseFloat(record.Voltage);
        const powerFactor = parseFloat(record["Power Factor"]);
        const consumption = parseFloat(record.Consumption);
        const rollingAvg = parseFloat(record.rolling_avg);
        const billing = consumption * 10; 

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

    // 5. COMBINE RESULTS & UPDATE DATABASE
    let anomalies_found = 0;
    
    const mlPredictionMap = new Map(mlPredictions.map(p => [p.id, p]));

    const updatePromises = dataToPredict.map((record) => {
      const mlPrediction = mlPredictionMap.get(record.id);
      
      const mlFlagged = mlPrediction?.is_anomaly || false;
      const mlConfidence = mlPrediction?.confidence || 0;
      
      const ruleFlagged = ruleBreaches.has(record.id);

      const final_is_anomaly = mlFlagged || ruleFlagged;

      if (final_is_anomaly) {
        anomalies_found++;
      }
      
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

  } catch (error: any) {
    console.error('Prediction API Error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}