// FILE: app/api/admin/analytics-charts/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Query 1: Monthly Consumption (Last 12 months)
    const consumptionQuery = db.query(`
      SELECT
        TO_CHAR(record_date, 'YYYY-MM') AS month_year,
        SUM("Consumption") AS kwh
      FROM data_records
      WHERE record_date >= NOW() - INTERVAL '12 months'
      GROUP BY month_year
      ORDER BY month_year ASC
    `);

    // Query 2: Anomalies per Month (Last 12 months)
    const anomalyQuery = db.query(`
      SELECT
        TO_CHAR(record_date, 'YYYY-MM') AS month_year,
        COUNT(*) AS anomalies
      FROM data_records
      WHERE is_anomaly = true AND record_date >= NOW() - INTERVAL '12 months'
      GROUP BY month_year
      ORDER BY month_year ASC
    `);

    // Query 3: Seasonal Anomaly Rate
    const seasonQuery = db.query(`
      SELECT
        CASE
          WHEN EXTRACT(MONTH FROM record_date) IN (12, 1, 2) THEN 'Winter'
          WHEN EXTRACT(MONTH FROM record_date) IN (3, 4, 5) THEN 'Spring'
          WHEN EXTRACT(MONTH FROM record_date) IN (6, 7, 8) THEN 'Summer'
          ELSE 'Monsoon'
        END AS season,
        COUNT(*) AS anomalies
      FROM data_records
      WHERE is_anomaly = true
      GROUP BY season
    `);

    // Query 4: Power Factor vs. Billing Scatter (Sample of 100)
    const scatterQuery = db.query(`
      SELECT
        "Power Factor" as pf,
        "Consumption" * 10 AS billing -- Est. billing
      FROM data_records
      WHERE "Power Factor" IS NOT NULL AND "Consumption" IS NOT NULL
      ORDER BY RANDOM() -- Get a random sample
      LIMIT 100
    `);

    // Run all queries in parallel
    const [
      consumptionResult,
      anomalyResult,
      seasonResult,
      scatterResult
    ] = await Promise.all([
      consumptionQuery,
      anomalyQuery,
      seasonQuery,
      scatterQuery
    ]);

    // Format chart data
    const formatMonth = (row: { month_year: string }) => ({
      ...row,
      month: new Date(row.month_year + '-02').toLocaleString('default', { month: 'short' }),
    });

    const monthlyConsumption = consumptionResult.rows.map(formatMonth);
    const anomaliesPerMonth = anomalyResult.rows.map(formatMonth);
    const seasonHeat = seasonResult.rows;
    const pfBilling = scatterResult.rows.map(r => ({
        pf: parseFloat(r.pf),
        billing: parseFloat(r.billing)
    }));

    // Combine all data into one response
    return NextResponse.json({
      monthlyConsumption,
      anomaliesPerMonth,
      seasonHeat,
      pfBilling
    });

  } catch (error) {
    console.error('API Error fetching admin analytics charts:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}