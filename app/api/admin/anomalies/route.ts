// FILE: app/api/admin/anomalies/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Import our database utility

// This function fetches all records that have been flagged as an anomaly
// FILE: app/api/admin/anomalies/route.ts

// GET function (REPLACED)
// FILE: app/api/admin/anomalies/route.ts

// --- REPLACE THE GET FUNCTION WITH THIS ---
export async function GET() {
  try {
    // This query uses GROUP BY to ensure each anomaly ID (d.id) is unique,
    // even if multiple users are linked to the same RRNO.
    const query = `
      SELECT
        d.id,
        d.rrno,
        d.record_date,
        d."Consumption",
        d."Voltage",
        d.confidence,
        d.status, 
        (array_agg(u.name))[1] AS name,
        (array_agg(u.address))[1] AS address,
        (array_agg(u.address))[1] AS village 
      FROM data_records d
      JOIN users u ON d.rrno = u.rrno
      WHERE d.is_anomaly = true
      GROUP BY d.id
      ORDER BY d.record_date DESC
    `;
    const { rows } = await db.query(query, []);
    return NextResponse.json({ anomalies: rows });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch anomalies' }, { status: 500 });
  }
}

// (The POST function below this stays exactly the same)

// (The POST function below this stays exactly the same)

// This function handles updating an anomaly (e.g., adding a note or changing its status)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, note, status } = body;

    // This part handles updating the status (e.g., marking as false positive)
    // --- THIS QUERY IS NOW FIXED (it uses the new 'status' column) ---
    if (action === 'update-status') {
      const query = `
        UPDATE data_records 
        SET status = $1, is_anomaly = $2
        WHERE id = $3
        RETURNING *;
      `;
      // If status is 'normal', we set is_anomaly to false
      const values = [status, status !== 'normal', id];
      const { rows } = await db.query(query, values);
      return NextResponse.json({ success: true, anomaly: rows[0] });
    }

    // This part handles adding a note
    if (action === 'add-note') {
       // We will implement this in the next step, for now it's a placeholder
       console.log(`Note added to anomaly ${id}: ${note}`);
       return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to update anomaly' }, { status: 500 });
  }
}