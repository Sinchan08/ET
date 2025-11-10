// FILE: app/api/user/[id]/complaints/[complaintId]/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; complaintId: string } }
) {
  try {
    const userId = params.id; // Get user ID from the URL
    const complaintId = params.complaintId; // Get complaint ID from the URL

    // This query is safer: it uses the userId from the URL to
    // ensure a user can ONLY delete their own complaints.
    const deleteQuery = await db.query(
      `DELETE FROM complaints
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [complaintId, userId]
    );

    if (deleteQuery.rowCount === 0) {
      return NextResponse.json(
        { error: 'Complaint not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Success
    return NextResponse.json({ message: 'Complaint deleted successfully' });

  } catch (error) {
    console.error('API Error deleting complaint:', error);
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
  }
}