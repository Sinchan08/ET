// FILE: app/user/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

export default function UserDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        setLoading(true)
        try {
          const response = await fetch(`/api/user/${user.id}/dashboard`);
          if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
          }
          const dashboardData = await response.json();
          setData(dashboardData);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
      fetchData()
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        {/* This now loads from the API data, feeling faster */}
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, {data?.welcomeName}!</h2>
        <p className="text-muted-foreground">
          Here is an overview of your electricity account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Consumption (All Time)</CardDescription>
            <CardTitle className="text-4xl">
              {data?.totalConsumption || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">kWh</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Voltage</CardDescription>
            <CardTitle className="text-4xl">
              {data?.avgVoltage || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">V</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Complaints</CardDescription>
            <CardTitle className="text-4xl">
              {data?.pendingComplaints || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Your active, unresolved complaints
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Account Status</CardDescription>
            <CardTitle className="text-4xl text-green-600">
              Good
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              No anomalies detected recently
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Usage Overview</CardTitle>
          <CardDescription>Your consumption for the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-80 w-full">
            <BarChart data={data?.chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-primary)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}