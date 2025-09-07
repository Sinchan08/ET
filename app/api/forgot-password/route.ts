// app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // --- In a real application, you would do the following: ---
  // 1. Check if a user with this email exists in your database.
  // 2. Generate a secure, unique, and expiring password reset token.
  // 3. Save the token and its expiry date to the user's record in the database.
  // 4. Use an email service (like SendGrid, Resend, or Nodemailer) to send an email
  //    to the user with a link containing the token, e.g., /reset-password?token=...

  console.log(`Password reset requested for: ${email}. In a real app, an email would be sent.`);

  // For this project, we will just simulate a successful response.
  return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
}