// app/signup/user/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UserSignUpPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phoneNumber: '', address: '', rrno: '', password: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, role: 'user' }),
    });

    if (response.ok) {
      alert('Registration successful! Please log in.');
      router.push('/auth');
    } else {
      const data = await response.json();
      setError(data.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">User Sign Up</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" type="text" onChange={handleChange} required /></div>
            <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" onChange={handleChange} required /></div>
            <div className="grid gap-2"><Label htmlFor="phoneNumber">Phone Number</Label><Input id="phoneNumber" type="tel" onChange={handleChange} required /></div>
            <div className="grid gap-2"><Label htmlFor="address">Address</Label><Input id="address" type="text" onChange={handleChange} required /></div>
            <div className="grid gap-2"><Label htmlFor="rrno">Meter ID (RRNO)</Label><Input id="rrno" type="text" onChange={handleChange} required /></div>
            <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" onChange={handleChange} required /></div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">Create an account</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth" className="underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}