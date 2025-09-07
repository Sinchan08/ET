/*import { NextResponse, type NextRequest } from "next/server"

type Dataset = {
  id: string
  name: string
  createdAt: string
  count: number
  sample: any[]
}

let DATASETS: Dataset[] = []

export async function GET() {
  return NextResponse.json({ datasets: DATASETS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = `ds_${Date.now()}`
    const dataset: Dataset = {
      id,
      name: body.name || "dataset.csv",
      createdAt: new Date().toISOString(),
      count: Array.isArray(body.rows) ? body.rows.length : 0,
      sample: Array.isArray(body.rows) ? body.rows.slice(0, 50) : [],
    }
    DATASETS.unshift(dataset)
    return NextResponse.json({ success: true, dataset, count: dataset.count })
  } catch (e) {
    return NextResponse.json({ error: "Failed to save dataset" }, { status: 500 })
  }
}
*/
// app/api/admin/datasets/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Import our database utility

// This function handles saving the uploaded dataset
export async function POST(request: Request) {
  try {
    const { rows: uploadedRows } = await request.json();

    // Check if there are any rows to insert
    if (!uploadedRows || uploadedRows.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // We will build a single, efficient query to insert all rows at once.
    // This is much faster than sending one query for each row.
    const query = `
      INSERT INTO data_records (rrno, village, record_date, consumption, voltage)
      VALUES ($1, $2, $3, $4, $5)
    `;

    // We use a loop to execute the insert query for each row of data from the frontend.
    for (const row of uploadedRows) {
      const values = [
        row.RRNO,
        row.village,
        new Date(row.date), // Ensure the date is in the correct format
        row.consumption,
        row.voltage,
      ];
      await db.query(query, values);
    }

    // We send back a success response
    return NextResponse.json({ success: true, count: uploadedRows.length }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save dataset' }, { status: 500 });
  }
}

// This function handles fetching all the records that have been uploaded
export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM data_records ORDER BY created_at DESC', []);
    return NextResponse.json({ datasets: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
}