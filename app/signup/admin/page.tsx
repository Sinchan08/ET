// app/signup/admin/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSignUpPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', employeeId: '', department: '', password: '',
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
      body: JSON.stringify({ ...formData, role: 'admin' }),
    });

    if (response.ok) {
      alert('Admin registration successful! Please log in.');
      router.push('/auth');
    } else {
      const data = await response.json();
      setError(data.error || 'Admin registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Registration</CardTitle>
          <CardDescription>Enter admin details to create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2"><Label htmlFor="name">Full Name</Label><Input id="name" type="text" onChange={handleChange} required /></div>
            <div className="grid gap-2"><Label htmlFor="email">Work Email</Label><Input id="email" type="email" onChange={handleChange} required /></div>
            <div className="grid gap-2"><Label htmlFor="employeeId">Employee ID</Label><Input id="employeeId" type="text" onChange={handleChange} required /></div>
            <div className="grid gap-2"><Label htmlFor="department">Department</Label><Input id="department" type="text" onChange={handleChange} required /></div>
            <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" onChange={handleChange} required /></div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">Create Admin Account</Button>
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