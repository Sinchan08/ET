// app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Import our database utility

// This function handles POST requests to /api/auth/login
export async function POST(request: Request) {
  console.log("DATABASE_URL being used:", process.env.DATABASE_URL);
  try {
    const { email, password } = await request.json();

    // This is the SQL query to find a user with the matching email and password
    const query = 'SELECT id, email, name, role FROM users WHERE email = $1 AND password = $2';
    const values = [email, password];

    // We execute the query
    const { rows } = await db.query(query, values);

    // If we find a user (rows.length > 0), the login is successful
    if (rows.length > 0) {
      const user = rows[0];
      
      // NOTE: In a real app, you would generate a secure JWT token here.
      // For now, we'll keep the mock token logic to keep things simple.
      const token = `mock_jwt_token_${user.id}_${Date.now()}`;
      
      return NextResponse.json({
        token,
        user,
      });
    } else {
      // If no user is found, return an error
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}