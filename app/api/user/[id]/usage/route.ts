// FILE: app/api/user/[id]/usage/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // 1. Get the user's RRNO
    const userQuery = await db.query('SELECT rrno FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const rrno = userQuery.rows[0].rrno;

    // 2. Get the single LATEST record for this user
    const latestRecordQuery = await db.query(
      `SELECT *, TO_CHAR(record_date, 'YYYY-MM-DD') as date
       FROM data_records
       WHERE rrno = $1
       ORDER BY record_date DESC
       LIMIT 1`,
      [rrno]
    );
    const latestRecord = latestRecordQuery.rows[0] || {};

    // 3. Get the last 7 records for the chart
    const chartDataQuery = await db.query(
      `SELECT "Consumption" as consumption, TO_CHAR(record_date, 'YYYY-MM-DD') as date
       FROM data_records
       WHERE rrno = $1
       ORDER BY record_date DESC
       LIMIT 7`,
      [rrno]
    );
    // Reverse to show oldest-to-newest on the chart
    const chartData = chartDataQuery.rows.reverse();

    // 4. Combine into the 'result' object the page expects
    const result = {
      rrno: rrno,
      status: latestRecord.is_anomaly ? 'suspicious' : 'normal',
      confidence: latestRecord.confidence || 0.95,
      lastReading: {
        date: latestRecord.date,
        consumption: latestRecord.Consumption,
        voltage: latestRecord.Voltage,
        current: latestRecord.Current,
        billing: (latestRecord.Consumption * 10).toFixed(2), // Est. billing
        powerFactor: latestRecord['Power Factor'],
      },
      anomalyType: latestRecord.is_anomaly ? 'ML Detected' : null,
      riskLevel: latestRecord.is_anomaly ? 'medium' : 'low',
      recommendations: latestRecord.is_anomaly
        ? ["Unusual activity detected.", "Please check your recent usage.", "If you suspect an error, file a complaint."]
        : ["Usage is within normal range", "Continue regular monitoring"],
      chartData: chartData, // This is the new field for the chart
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error fetching usage data:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}