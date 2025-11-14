// FILE: app/api/admin/dashboard-stats/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch Stats for the Cards (No change here)
    const userStatsQuery = db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM data_records WHERE is_anomaly = true) AS total_anomalies,
        (SELECT COUNT(*) FROM data_records WHERE is_anomaly = false) AS total_normal,
        (SELECT AVG(confidence) FROM data_records WHERE is_anomaly = true) AS avg_confidence
    `);
    
    // 2. Fetch Data for Monthly Anomaly Chart (No change here)
    const monthlyChartQuery = db.query(`
      SELECT
        TO_CHAR(record_date, 'YYYY-MM') AS month_year,
        SUM(CASE WHEN is_anomaly = true THEN 1 ELSE 0 END) AS anomalies,
        SUM(CASE WHEN is_anomaly = false THEN 1 ELSE 0 END) AS normal
      FROM data_records
      WHERE record_date >= NOW() - INTERVAL '6 months'
      GROUP BY month_year
      ORDER BY month_year ASC
      LIMIT 6
    `);
    
    // --- 3. THIS IS THE NEW QUERY FOR THE PIE CHART ---
    const pieChartQuery = db.query(`
      SELECT 
        anomaly_reason, 
        COUNT(*) AS value 
      FROM data_records 
      WHERE is_anomaly = true AND anomaly_reason IS NOT NULL 
      GROUP BY anomaly_reason
    `);

    // Run ALL queries in parallel
    const [
      userStatsResult, 
      monthlyChartResult,
      pieChartResult // <-- Added
    ] = await Promise.all([
      userStatsQuery,
      monthlyChartQuery,
      pieChartQuery // <-- Added
    ]);

    const stats = userStatsResult.rows[0];
    
    const formattedChartData = monthlyChartResult.rows.map(row => ({
      month: new Date(row.month_year + '-02').toLocaleString('default', { month: 'short' }),
      anomalies: parseInt(row.anomalies, 10),
      normal: parseInt(row.normal, 10),
    }));

    // --- Format the pie chart data ---
    // The query returns { anomaly_reason: "Low Voltage", value: "35" }
    // We just need to parse the value
    const pieChartData = pieChartResult.rows.map(row => ({
      name: row.anomaly_reason, // <-- 'name' for the chart
      value: parseInt(row.value, 10) // <-- 'value' for the chart
    }));

    // 4. Combine all data into one response
    return NextResponse.json({
      stats: {
        totalUsers: stats.total_users || 0,
        totalAnomalies: stats.total_anomalies || 0,
        totalNormal: stats.total_normal || 0,
        detectionAccuracy: stats.avg_confidence ? (parseFloat(stats.avg_confidence) * 100).toFixed(1) : "0.0"
      },
      monthlyData: formattedChartData,
      pieChartData: pieChartData, // <-- ADDED
    });

  } catch (error) {
    console.error('API Error fetching admin dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}