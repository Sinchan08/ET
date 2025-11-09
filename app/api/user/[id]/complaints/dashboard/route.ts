// FILE: app/api/user/[id]/dashboard/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // 1. Get the user's RRNO from their ID
    const userQuery = await db.query('SELECT rrno FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const rrno = userQuery.rows[0].rrno;

    // 2. Get statistics for the Card components
    const statsQuery = db.query(
      `SELECT
         SUM("Consumption") AS total_consumption,
         AVG("Voltage") AS avg_voltage
       FROM data_records
       WHERE rrno = $1`,
      [rrno]
    );

    // 3. Get pending complaints count
    const complaintsQuery = db.query(
      `SELECT COUNT(*) AS pending_complaints
       FROM complaints
       WHERE user_id = $1 AND status = 'submitted'`,
      [userId]
    );

    // 4. Get data for the monthly usage chart (last 6 months)
    const chartQuery = db.query(
      `SELECT
         TO_CHAR(record_date, 'YYYY-MM') AS month,
         SUM("Consumption") AS total
       FROM data_records
       WHERE rrno = $1
       GROUP BY month
       ORDER BY month DESC
       LIMIT 6`,
      [rrno]
    );

    // Run all queries concurrently
    const [statsResult, complaintsResult, chartResult] = await Promise.all([
      statsQuery,
      complaintsQuery,
      chartQuery,
    ]);

    const stats = statsResult.rows[0];
    const chartData = chartResult.rows.reverse(); // Reverse to show oldest first
    const pendingComplaints = complaintsResult.rows[0].pending_complaints;

    // 5. Return all data in one object
    return NextResponse.json({
      totalConsumption: stats.total_consumption || 0,
      avgVoltage: parseFloat(stats.avg_voltage || 0).toFixed(2),
      pendingComplaints: pendingComplaints,
      chartData: chartData,
    });

  } catch (error) {
    console.error('API Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}