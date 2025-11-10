// FILE: app/api/user/[id]/password/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All password fields are required' }, { status: 400 });
    }

    // 1. Get the user's current hashed password from the DB
    const userQuery = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const hashedPassword = userQuery.rows[0].password;

    // 2. Check if the 'currentPassword' from the form matches the one in the DB
    const passwordsMatch = await bcrypt.compare(currentPassword, hashedPassword);
    if (!passwordsMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    // 3. Hash the new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update the database with the new password
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [
      newHashedPassword,
      userId,
    ]);

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('API Error changing password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}