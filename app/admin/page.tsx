// FILE: app/admin/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Users, Brain } from 'lucide-react'
// --- Import Pie, Cell, and Legend ---
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

// --- Define preset colors for our anomaly types ---
const COLORS: { [key: string]: string } = {
  "Consumption Spike": "#ef4444",
  "High Billing": "#f97316",
  "Low Voltage": "#eab308",
  "High Voltage": "#f59e0b",
  "Low Power Factor": "#84cc16",
  "ML Prediction": "#3b82f6",
  "default": "#6b7280" // Fallback color
};

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
// --- NEW TYPE for Pie Chart ---
interface PieChartData {
  name: string;
  value: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatCards | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]); // <-- ADDED
  const [loading, setLoading] = useState(true);

  // Fetch data from our updated API route
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
        setPieChartData(data.pieChartData || []); // <-- ADDED
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
                  <Legend />
                  <Bar dataKey="normal" fill="#22c55e" name="Normal" />
                  <Bar dataKey="anomalies" fill="#ef4444" name="Anomalies" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomaly Types Distribution</CardTitle>
            <CardDescription>Breakdown of different anomaly categories</CardDescription>
          </CardHeader>
          <CardContent>
            {/* --- THIS IS THE UPDATED PIE CHART --- */}
            {loading ? (
               <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value" // <-- Use 'value'
                    nameKey="name"  // <-- Use 'name'
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={COLORS[entry.name] || COLORS.default} // <-- Use color map
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
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
      </CardContent>
    </Card>
  )
}