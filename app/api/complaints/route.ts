// FILE: app/api/complaints/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: Fetch ALL complaints for the Admin Dashboard
export async function GET() {
  try {
    // We join 'complaints' with 'users' to get the name and email of the person who complained
    const query = `
      SELECT 
        c.id, 
        c.subject, 
        c.description, 
        c.status, 
        c.created_at, 
        c.rrno,
        u.name as user_name, 
        u.email as user_email
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

// POST: Create a new complaint (Used by User Portal)
export async function POST(request: Request) {
  try {
    const { subject, description, type, rrno, userId } = await request.json();

    if (!subject || !description || !rrno || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert the new complaint
    const { rows } = await db.query(
      `INSERT INTO complaints (subject, description, type, rrno, user_id, status)
       VALUES ($1, $2, $3, $4, $5, 'submitted')
       RETURNING *`,
      [subject, description, type || 'General', rrno, userId]
    );

    return NextResponse.json(rows[0], { status: 201 });

  } catch (error) {
    console.error('API Error creating complaint:', error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}