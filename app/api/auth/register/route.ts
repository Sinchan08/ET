
// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, ...details } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if a user with this email already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Securely hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    let query = '';
    let values: any[] = [];

    if (role === 'user') {
      const { phoneNumber, address, rrno } = details;
      query = `
        INSERT INTO users (email, password, name, role, phone_number, address, rrno)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, name, role;
      `;
      values = [email, hashedPassword, name, role, phoneNumber, address, rrno];
    } else if (role === 'admin') {
      const { employeeId, department } = details;
      query = `
        INSERT INTO users (email, password, name, role, employee_id, department)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, role;
      `;
      values = [email, hashedPassword, name, role, employeeId, department];
    } else {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const { rows } = await db.query(query, values);
    const newUser = rows[0];

    return NextResponse.json({ user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}