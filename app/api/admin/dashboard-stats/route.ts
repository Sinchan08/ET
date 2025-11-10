// FILE: app/api/admin/dashboard-stats/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch Stats for the Cards
    // 1. Fetch Stats for the Cards (FIXED QUERY)
    const userStatsQuery = db.query(`
      SELECT
        u.total_users,
        d.total_anomalies,
        d.total_normal,
        d.avg_confidence
      FROM
        (SELECT COUNT(*) AS total_users FROM users) AS u
      CROSS JOIN
        (SELECT
           COUNT(*) FILTER (WHERE is_anomaly = true) AS total_anomalies,
           COUNT(*) FILTER (WHERE is_anomaly = false) AS total_normal,
           AVG(confidence) FILTER (WHERE is_anomaly = true) AS avg_confidence
         FROM data_records
        ) AS d
    `);
    
    // 2. Fetch Data for Monthly Anomaly Chart (last 6 months)
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

    // Run queries in parallel
    const [userStatsResult, monthlyChartResult] = await Promise.all([
      userStatsQuery,
      monthlyChartQuery,
    ]);

    const stats = userStatsResult.rows[0];
    
    // Format chart data (e.g., "2024-10" -> "Oct")
    const formattedChartData = monthlyChartResult.rows.map(row => ({
      month: new Date(row.month_year + '-02').toLocaleString('default', { month: 'short' }),
      anomalies: parseInt(row.anomalies, 10),
      normal: parseInt(row.normal, 10),
    }));

    // 3. Combine all data into one response
    return NextResponse.json({
      stats: {
        totalUsers: stats.total_users || 0,
        totalAnomalies: stats.total_anomalies || 0,
        totalNormal: stats.total_normal || 0,
        // Calculate detection accuracy based on confidence
        detectionAccuracy: stats.avg_confidence ? (parseFloat(stats.avg_confidence) * 100).toFixed(1) : "0.0"
      },
      monthlyData: formattedChartData,
    });

  } catch (error) {
    console.error('API Error fetching admin dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}