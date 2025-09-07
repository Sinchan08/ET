"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ScatterChart, Scatter } from "recharts"
import { BarChartIcon as ChartBar, Calendar } from 'lucide-react'

const monthlyConsumption = [
  { month: "Jan", kwh: 3200 }, { month: "Feb", kwh: 2980 }, { month: "Mar", kwh: 3420 },
  { month: "Apr", kwh: 2850 }, { month: "May", kwh: 3150 }, { month: "Jun", kwh: 2780 },
]

const anomaliesPerMonth = [
  { month: "Jan", anomalies: 45 }, { month: "Feb", anomalies: 52 }, { month: "Mar", anomalies: 38 },
  { month: "Apr", anomalies: 61 }, { month: "May", anomalies: 49 }, { month: "Jun", anomalies: 67 },
]

const seasonHeat = [
  { season: "Winter", theftRate: 0.18 },
  { season: "Spring", theftRate: 0.21 },
  { season: "Summer", theftRate: 0.33 },
  { season: "Monsoon", theftRate: 0.27 },
]

const pfBilling = Array.from({ length: 50 }).map((_, i) => ({
  pf: Number((0.6 + Math.random() * 0.35).toFixed(2)),
  billing: Math.floor(2000 + Math.random() * 8000),
}))

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<any>()
  const [village, setVillage] = useState("all")
  const [rrno, setRrno] = useState("all")
  const [season, setSeason] = useState("all")

  const heatCells = useMemo(() => {
    return seasonHeat.map((s) => ({
      ...s,
      color: s.theftRate > 0.3 ? "bg-red-500" : s.theftRate > 0.22 ? "bg-yellow-500" : "bg-green-500",
    }))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Visualize trends and KPIs</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>Date Range</Label>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          </div>
          <div>
            <Label>Village</Label>
            <Select value={village} onValueChange={setVillage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Ankola">Ankola</SelectItem>
                <SelectItem value="Belambar">Belambar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>RRNO</Label>
            <Select value={rrno} onValueChange={setRrno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="RR1001">RR1001</SelectItem>
                <SelectItem value="RR2002">RR2002</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Season</Label>
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
                <SelectItem value="Monsoon">Monsoon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Consumption
            </CardTitle>
            <CardDescription>Total kWh by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyConsumption}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="kwh" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="h-5 w-5" />
              Anomalies per Month
            </CardTitle>
            <CardDescription>Detected anomalies by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={anomaliesPerMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="anomalies" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Season vs Theft Rate (Heatmap)</CardTitle>
            <CardDescription>Relative theft rate by season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {heatCells.map((c) => (
                <div key={c.season} className="p-3 rounded-md border text-white">
                  <div className={`w-full h-16 rounded ${c.color}`} />
                  <div className="mt-2 text-sm">{c.season} — {(c.theftRate * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Power Factor vs Billing (Scatter)</CardTitle>
            <CardDescription>Distribution of bills vs PF</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="pf" name="Power Factor" domain={[0.5, 1]} />
                <YAxis type="number" dataKey="billing" name="Billing" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={pfBilling} fill="#a855f7" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
