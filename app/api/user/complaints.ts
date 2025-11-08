// FILE: app/api/user/complaints.ts
// THIS IS A TEMPORARY API - WE WILL FIX IT LATER
// FOR NOW, IT WILL JUST FETCH COMPLAINTS FOR USER_ID 1

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // TODO: Get user ID from a real session, not hardcoded.
    const userId = 1; 

    const { rows } = await db.query(
      `SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error fetching user complaints:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}