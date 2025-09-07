/*import { NextResponse, type NextRequest } from "next/server"

type Anomaly = {
  id: string
  rrno: string
  name?: string
  village?: string
  address?: string
  date: string
  consumption: number
  voltage: number
  status: "theft" | "suspicious" | "normal"
  confidence: number
  anomaly_type?: string
  notes?: string[]
}

let ANOMALIES: Anomaly[] = [
  {
    id: "anom_001",
    rrno: "RR1001",
    name: "John Doe",
    village: "Ankola",
    address: "123 Main Street",
    date: "2024-01-04",
    consumption: 412,
    voltage: 210,
    status: "suspicious",
    confidence: 0.78,
    anomaly_type: "Voltage Anomaly",
    notes: [],
  },
]

export async function GET() {
  return NextResponse.json({ anomalies: ANOMALIES })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.action === "add-note") {
      const { id, note } = body
      const idx = ANOMALIES.findIndex((a) => a.id === id)
      if (idx >= 0) {
        ANOMALIES[idx].notes = ANOMALIES[idx].notes || []
        ANOMALIES[idx].notes!.push(note)
        return NextResponse.json({ success: true, anomaly: ANOMALIES[idx] })
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (body.action === "update-status") {
      const { id, status } = body
      const idx = ANOMALIES.findIndex((a) => a.id === id)
      if (idx >= 0) {
        ANOMALIES[idx].status = status
        return NextResponse.json({ success: true, anomaly: ANOMALIES[idx] })
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (body.action === "upsert") {
      const record = body.record as Anomaly
      const idx = ANOMALIES.findIndex((a) => a.id === record.id)
      if (idx >= 0) {
        ANOMALIES[idx] = { ...ANOMALIES[idx], ...record }
      } else {
        ANOMALIES.unshift({ ...record, id: record.id || `anom_${Date.now()}` })
      }
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
*/
// app/api/admin/anomalies/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Import our database utility

// This function fetches all records that have been flagged as an anomaly
export async function GET() {
  try {
    // Note the "WHERE is_anomaly = true" clause to only get relevant records
    const query = 'SELECT * FROM data_records WHERE is_anomaly = true ORDER BY record_date DESC';
    const { rows } = await db.query(query, []);
    return NextResponse.json({ anomalies: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch anomalies' }, { status: 500 });
  }
}

// This function handles updating an anomaly (e.g., adding a note or changing its status)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, note, status } = body;

    // This part handles updating the status (e.g., marking as false positive)
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

    // This part handles adding a note (Note: the current DB schema doesn't have a notes field,
    // this is a placeholder for if you add one later. For now, it won't do anything).
    if (action === 'add-note') {
       // To implement this, you would add a "notes TEXT[]" column to your data_records table
       console.log(`Note added to anomaly ${id}: ${note}`);
       // const query = "UPDATE data_records SET notes = array_append(notes, $1) WHERE id = $2";
       // await db.query(query, [note, id]);
       return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to update anomaly' }, { status: 500 });
  }
}