/*import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Mock complaints data
    const complaints = [
      {
        id: "comp_001",
        rrno: "RR1001",
        type: "High Bill",
        subject: "Unusually high electricity bill",
        description: "My electricity bill for this month is 3x higher than usual",
        status: "in_review",
        priority: "high",
        created_at: "2024-01-20T10:30:00Z",
        updated_at: "2024-01-21T14:20:00Z",
      },
      {
        id: "comp_002",
        rrno: "RR1001",
        type: "Meter Issue",
        subject: "Meter reading discrepancy",
        description: "The meter reading doesn't match my actual usage",
        status: "resolved",
        priority: "medium",
        created_at: "2024-01-15T09:15:00Z",
        updated_at: "2024-01-18T16:45:00Z",
      },
    ]

    return NextResponse.json({ complaints })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Create new complaint
    const newComplaint = {
      id: `comp_${Date.now()}`,
      ...data,
      status: "submitted",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      complaint: newComplaint,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 })
  }
}
*/

// app/api/complaints/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Import our new database utility!

// This function will handle GET requests to /api/complaints
export async function GET() {
  try {
    // We write a simple SQL query to get all complaints
    const query = 'SELECT * FROM complaints ORDER BY created_at DESC';
    
    // We use our db utility to send the query to Supabase
    const { rows } = await db.query(query, []);

    // We send the actual data from the database back to the frontend
    return NextResponse.json({ complaints: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

// This function will handle POST requests to /api/complaints
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // IMPORTANT: In a real app, you would get the user's ID from a secure session.
    // For our demo, we'll hardcode the ID of the 'user@demo.com' user we created.
    const userId = 1; 

    // This is the SQL query to insert a new complaint.
    // The placeholders ($1, $2, etc.) are a security best practice.
    const query = `
      INSERT INTO complaints (user_id, rrno, type, subject, description, status, priority)
      VALUES ($1, $2, $3, $4, $5, 'submitted', $6)
      RETURNING *; 
    `;
    
    const values = [
      userId,
      "RR1001", // This is also hardcoded for now, you can get it from the user session later
      data.type,
      data.subject,
      data.description,
      data.priority
    ];

    // We execute the query with the data from the frontend
    const { rows } = await db.query(query, values);

    // We return the newly created complaint back to the frontend
    return NextResponse.json({ success: true, complaint: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}