"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, FileText, Calendar, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

const mockUsageData = [
  { date: "Jan 1", consumption: 245 },
  { date: "Jan 2", consumption: 267 },
  { date: "Jan 3", consumption: 234 },
  { date: "Jan 4", consumption: 289 },
  { date: "Jan 5", consumption: 256 },
  { date: "Jan 6", consumption: 278 },
  { date: "Jan 7", consumption: 245 },
]

export default function UserDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">Check your electricity usage and anomaly status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Status</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Normal
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last checked 2 hours ago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245 kWh</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Complaints</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">1 in review, 1 resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Report</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Jan 7</div>
            <p className="text-xs text-muted-foreground">Normal reading</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usage Trend (Last 7 Days)</CardTitle>
            <CardDescription>Your daily electricity consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Consumption (kWh)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/user/check-usage">
              <Button className="w-full justify-start" variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Check Current Usage
              </Button>
            </Link>
            <Link href="/user/reports">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View My Reports
              </Button>
            </Link>
            <Link href="/user/complaints">
              <Button className="w-full justify-start" variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                File a Complaint
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm">Usage checked - Normal reading confirmed</p>
                <p className="text-xs text-muted-foreground">Today, 2:30 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm">Monthly report generated</p>
                <p className="text-xs text-muted-foreground">Yesterday, 6:00 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm">Complaint #C001 status updated to "Resolved"</p>
                <p className="text-xs text-muted-foreground">2 days ago, 3:15 PM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

