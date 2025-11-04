import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    // --- START OF NEW DEBUG CODE ---
    // Let's check each field one by one.
    if (!email) {
      return NextResponse.json({ error: 'Server received an EMPTY EMAIL field.' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: 'Server received an EMPTY PASSWORD field.' }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ error: 'Server received an EMPTY ROLE field.' }, { status: 400 });
    }
    // --- END OF NEW DEBUG CODE ---

    console.log(`DATABASE_URL being used: ${process.env.DATABASE_URL}`);

    // 1. Find the user by EMAIL ONLY first.
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];
    const { rows } = await db.query(query, values);

    // 2. Check if a user with that email even exists.
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
    }

    const user = rows[0];

    // 3. NOW check if the role from the toggle matches the user's role.
    if (user.role !== role) {
      return NextResponse.json({ error: `This is a ${user.role} account. Please use the '${user.role}' toggle to log in.` }, { status: 403 });
    }

    // 4. If email and role are correct, check the password.
    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
    }

    // If login is successful
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}