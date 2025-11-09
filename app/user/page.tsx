// FILE: app/user/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Zap, Signal } from "lucide-react"

// Define the structure of our API response
interface DashboardData {
  totalConsumption: number;
  avgVoltage: number;
  pendingComplaints: number;
  chartData: {
    month: string;
    total: number;
  }[];
}

export default function UserDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/user/${user.id}/dashboard`);
          if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
          }
          const dashboardData = await response.json();
          setData(dashboardData);
        } catch (error) {
          console.error(error);
          // Handle error (e.g., show toast)
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
  }, [user]) // Re-run when 'user' is available

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">
        Welcome back, {user ? user.name : '...'}!
      </h2>
      
      {/* 3 Main Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption (All Time)</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold">{data?.totalConsumption} kWh</div>
            )}
            <p className="text-xs text-muted-foreground">Total energy used since first record</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Voltage</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold">{data?.avgVoltage} V</div>
            )}
            <p className="text-xs text-muted-foreground">Average voltage received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Complaints</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold">{data?.pendingComplaints}</div>
            )}
            <p className="text-xs text-muted-foreground">Your active, unresolved complaints</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Usage Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          {loading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <ChartContainer config={{}} className="h-[350px] w-full">
              <BarChart accessibilityLayer data={data?.chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="total" fill="var(--color-primary)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}