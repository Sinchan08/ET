// FILE: app/admin/page.tsx
"use client"

import { useState, useEffect } from "react" // Import hooks
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Users, Brain, PieChart as PieIcon } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton

// --- This Pie Chart data is still mock, we will connect it in the next step ---
const anomalyTypes = [
  { name: "Consumption Spike", value: 35, color: "#ef4444" },
  { name: "Voltage Anomaly", value: 25, color: "#f97316" },
  { name: "Power Factor Issue", value: 20, color: "#eab308" },
  { name: "Billing Mismatch", value: 20, color: "#22c55e" },
]

// Define types for our fetched data
interface StatCards {
  totalUsers: string;
  totalAnomalies: string;
  totalNormal: string;
  detectionAccuracy: string;
}
interface MonthlyData {
  month: string;
  anomalies: number;
  normal: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatCards | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from our new API route
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/dashboard-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setStats(data.stats);
        setMonthlyData(data.monthlyData);
      } catch (error) {
        console.error(error);
        // You can add a toast notification here if you like
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Define stat card components for clean rendering
  const statCards = [
    { title: "Total Users", data: stats?.totalUsers, icon: Users, color: "text-blue-600" },
    { title: "Anomalies Detected", data: stats?.totalAnomalies, icon: AlertTriangle, color: "text-red-600" },
    { title: "Normal Readings", data: stats?.totalNormal, icon: CheckCircle, color: "text-green-600" },
    { title: "Avg. ML Confidence", data: `${stats?.detectionAccuracy}%`, icon: Brain, color: "text-purple-600" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor electricity theft detection across all regions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.data}</div>
                {/* <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p> */}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Anomaly Trends</CardTitle>
            <CardDescription>Comparison of normal vs anomalous readings (Last 6 Months)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="normal" fill="#22c55e" name="Normal" />
                  <Bar dataKey="anomalies" fill="#ef4444" name="Anomalies" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomaly Types Distribution (Mock Data)</CardTitle>
            <CardDescription>Breakdown of different anomaly categories</CardDescription>
          </CardHeader>
          <CardContent>
            {/* This pie chart still uses mock data. We will connect it in the next step. */}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={anomalyTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {anomalyTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// A helper component for loading skeletons
function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-1/3 mt-2" />
      </CardContent>
    </Card>
  )
}