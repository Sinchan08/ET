// FILE: app/api/complaints/[id]/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const complaintId = params.id; // Get the complaint ID from the URL

    const { rows } = await db.query(
      `UPDATE complaints
       SET status = 'resolved'
       WHERE id = $1
       RETURNING *`,
      [complaintId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error('API Error updating complaint:', error);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}