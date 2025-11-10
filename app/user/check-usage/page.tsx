// FILE: app/user/check-usage/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, CheckCircle, AlertTriangle, Calendar, Activity, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAuth } from "@/components/auth/auth-provider" // <-- 1. IMPORT useAuth
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

// 2. REMOVED mockUsageData

export default function CheckUsagePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null) // <-- 3. Start with null data
  const { user } = useAuth() // <-- 4. GET THE LOGGED-IN USER
  const { toast } = useToast()

  const checkUsage = async () => {
    if (!user) {
      toast({ title: "Error", description: "User not loaded.", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    // 5. THIS IS THE NEW FETCH LOGIC
    try {
      const response = await fetch(`/api/user/${user.id}/usage`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  
  // 6. Automatically fetch data when the page loads
  useEffect(() => {
    if (user) {
      checkUsage();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check Usage</h1>
        <p className="text-muted-foreground">Check your current electricity usage and anomaly status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Checker</CardTitle>
          <CardDescription>Your current usage status and recent analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={checkUsage} disabled={loading} className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              {loading ? "Checking..." : "Refresh Usage Status"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 7. Show skeleton loaders while loading */}
      {loading && !result && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-2/3" />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /></CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 8. Render the results once 'result' is not null */}
      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Usage Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>RRNO</span>
                <span className="font-mono font-semibold">{result.rrno}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <Badge
                  variant={result.status === "normal" ? "secondary" : "destructive"}
                  className={result.status === "normal" ? "bg-green-100 text-green-800" : ""}
                >
                  {result.status === "normal" ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Normal
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Anomaly Detected
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${result.confidence * 100}%` }} />
                  </div>
                  <span className="text-sm">{(result.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Risk Level</span>
                <Badge
                  variant={result.riskLevel === "low" ? "secondary" : "destructive"}
                  className={
                    result.riskLevel === "low"
                      ? "bg-green-100 text-green-800"
                      : result.riskLevel === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : ""
                  }
                >
                  {result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)} Risk
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Latest Reading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">{result.lastReading.date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consumption</p>
                  <p className="font-semibold">{result.lastReading.consumption || 0} kWh</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Voltage</p>
                  <p className="font-semibold">{result.lastReading.voltage || 0} V</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current</p>
                  <p className="font-semibold">{result.lastReading.current || 0} A</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing (Est.)</p>
                  <p className="font-semibold">₹{result.lastReading.billing || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Power Factor</p>
                  <p className="font-semibold">{result.lastReading.powerFactor || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usage Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {/* 9. Use real chart data */}
                <LineChart data={result.chartData}> 
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

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}