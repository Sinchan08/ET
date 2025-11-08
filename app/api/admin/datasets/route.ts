// FILE: app/api/admin/datasets/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json(); // Expects a raw array [...]

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided or data is empty' }, { status: 400 });
    }

    let insertedCount = 0;

    // This query now includes all the feature columns
    const insertQuery = `
      INSERT INTO data_records (
        rrno, record_date, "Consumption", "Voltage", "Current", "Power Factor", 
        "Bill_to_usage_ratio", "delta_units", "rolling_avg", "rolling_min", 
        "rolling_max", "rolling_std", "interaction_billing_pf", "month_sin", "month_cos"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      ON CONFLICT DO NOTHING
    `;
    
    // Loop and insert. db.query() handles connection pooling automatically.
    // This removes the 'db.getClient()' error.
    for (const record of data) {
      // Use the headers from TestingSet.csv (RRNO, date, Consumption, etc.)
      if (record && record.RRNO && record.date) {
        const values = [
          record.RRNO,
          record.date, // Use 'date' from the CSV
          parseFloat(record.Consumption) || null,
          parseFloat(record.Voltage) || null,
          parseFloat(record.Current) || null,
          parseFloat(record['Power Factor']) || null,
          parseFloat(record.Bill_to_usage_ratio) || null,
          parseFloat(record.delta_units) || null,
          parseFloat(record.rolling_avg) || null,
          parseFloat(record.rolling_min) || null,
          parseFloat(record.rolling_max) || null,
          parseFloat(record.rolling_std) || null,
          parseFloat(record.interaction_billing_pf) || null,
          parseFloat(record.month_sin) || null,
          parseFloat(record.month_cos) || null
        ];
        
        await db.query(insertQuery, values);
        insertedCount++;
      }
    }

    if (insertedCount === 0) {
      return NextResponse.json({ error: 'No new data was inserted. All records may be duplicates or invalid.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Data inserted successfully', count: insertedCount }, { status: 200 });
  } catch (error) {
    console.error('Data upload API error:', error);
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}