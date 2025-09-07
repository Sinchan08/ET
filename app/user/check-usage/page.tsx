"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, CheckCircle, AlertTriangle, Calendar, Activity, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const mockUsageData = [
  { date: "2024-01-01", consumption: 245, voltage: 230, current: 12 },
  { date: "2024-01-02", consumption: 267, voltage: 225, current: 13 },
  { date: "2024-01-03", consumption: 234, voltage: 235, current: 11 },
  { date: "2024-01-04", consumption: 289, voltage: 228, current: 14 },
  { date: "2024-01-05", consumption: 256, voltage: 232, current: 12 },
  { date: "2024-01-06", consumption: 278, voltage: 227, current: 13 },
  { date: "2024-01-07", consumption: 245, voltage: 230, current: 12 },
]

export default function CheckUsagePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>({
    rrno: "RR1001",
    status: "normal",
    confidence: 0.95,
    lastReading: {
      date: "2024-01-07",
      consumption: 245,
      voltage: 230,
      current: 12,
      billing: 2450,
      powerFactor: 0.85,
    },
    anomalyType: null,
    riskLevel: "low",
    recommendations: [
      "Usage is within normal range",
      "Continue regular monitoring",
      "Consider energy-saving practices"
    ],
  })

  const checkUsage = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
  }

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
                  <p className="font-semibold">{result.lastReading.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consumption</p>
                  <p className="font-semibold">{result.lastReading.consumption} kWh</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Voltage</p>
                  <p className="font-semibold">{result.lastReading.voltage} V</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current</p>
                  <p className="font-semibold">{result.lastReading.current} A</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing</p>
                  <p className="font-semibold">₹{result.lastReading.billing}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Power Factor</p>
                  <p className="font-semibold">{result.lastReading.powerFactor}</p>
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
