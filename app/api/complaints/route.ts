// FILE: app/api/complaints/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';
// We'll need to get the user from our auth... but for now, let's build the admin part.

// --- THIS IS THE NEW FUNCTION YOU ARE ADDING ---
// This GET function is for the ADMIN to fetch ALL complaints
export async function GET() {
  try {
    // We join with the users table to get the user's name and email
    const query = `
      SELECT c.id, c.subject, c.description, c.status, c.created_at, u.name as user_name, u.email as user_email
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `;
    const { rows } = await db.query(query);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error fetching complaints:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

// --- THIS IS YOUR EXISTING, WORKING POST FUNCTION ---
// (It has a small bug fix to get the user_id from the body)
export async function POST(request: Request) {
  try {
    // Note: In a real app, you'd get user_id from a session.
    // For now, we'll assume it's passed in the body.
    const { subject, description, type, rrno, userId } = await request.json();

    if (!subject || !description || !type || !rrno || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { rows } = await db.query(
      `INSERT INTO complaints (subject, description, type, rrno, user_id, status)
       VALUES ($1, $2, $3, $4, $5, 'submitted')
       RETURNING *`,
      [subject, description, type, rrno, userId]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('API Error creating complaint:', error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}