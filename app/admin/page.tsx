"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Users, Zap, FileText, Brain } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"

const monthlyData = [
  { month: "Jan", anomalies: 45, normal: 320 },
  { month: "Feb", anomalies: 52, normal: 298 },
  { month: "Mar", anomalies: 38, normal: 342 },
  { month: "Apr", anomalies: 61, normal: 285 },
  { month: "May", anomalies: 49, normal: 315 },
  { month: "Jun", anomalies: 67, normal: 278 },
]

const anomalyTypes = [
  { name: "Consumption Spike", value: 35, color: "#ef4444" },
  { name: "Voltage Anomaly", value: 25, color: "#f97316" },
  { name: "Power Factor Issue", value: 20, color: "#eab308" },
  { name: "Billing Mismatch", value: 20, color: "#22c55e" },
]

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Users",
      value: "3,205",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Anomalies Detected",
      value: "459",
      change: "+8%",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "Normal Readings",
      value: "2,746",
      change: "+5%",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Detection Accuracy",
      value: "94.2%",
      change: "+2%",
      icon: Brain,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor electricity theft detection across all regions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Anomaly Trends</CardTitle>
            <CardDescription>Comparison of normal vs anomalous readings</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomaly Types Distribution</CardTitle>
            <CardDescription>Breakdown of different anomaly categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={anomalyTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
