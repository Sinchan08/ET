// FILE: app/admin/analytics/page.tsx
"use client"

import { useMemo, useState, useEffect } from "react" // Import hooks
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ScatterChart, Scatter } from "recharts"
import { BarChartIcon as ChartBar, Calendar } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton

// --- DEFINE TYPES FOR OUR DATA ---
interface MonthlyConsumption {
  month: string;
  kwh: number;
}
interface AnomaliesPerMonth {
  month: string;
  anomalies: number;
}
interface SeasonHeat {
  season: string;
  anomalies: number;
}
interface PfBilling {
  pf: number;
  billing: number;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<any>()
  const [village, setVillage] = useState("all")
  const [rrno, setRrno] = useState("all")
  const [season, setSeason] = useState("all")

  // --- ADD STATE FOR LOADING AND DATA ---
  const [loading, setLoading] = useState(true);
  const [monthlyConsumption, setMonthlyConsumption] = useState<MonthlyConsumption[]>([]);
  const [anomaliesPerMonth, setAnomaliesPerMonth] = useState<AnomaliesPerMonth[]>([]);
  const [seasonHeat, setSeasonHeat] = useState<SeasonHeat[]>([]);
  const [pfBilling, setPfBilling] = useState<PfBilling[]>([]);

  // --- ADD useEffect TO FETCH DATA ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/analytics-charts');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setMonthlyConsumption(data.monthlyConsumption);
        setAnomaliesPerMonth(data.anomaliesPerMonth);
        setSeasonHeat(data.seasonHeat);
        setPfBilling(data.pfBilling);
      } catch (error) {
        console.error(error);
        // You could add a toast here
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []); // We can add filters here later if needed

  // --- PROCESS SEASON DATA FOR HEATMAP ---
  const heatCells = useMemo(() => {
    const totalAnomalies = seasonHeat.reduce((acc, s) => acc + s.anomalies, 0);
    if (totalAnomalies === 0) {
      return seasonHeat.map(s => ({ ...s, theftRate: 0, color: "bg-gray-500" }));
    }
    
    return seasonHeat.map((s) => {
      const theftRate = s.anomalies / totalAnomalies;
      return {
        ...s,
        theftRate,
        color: theftRate > 0.3 ? "bg-red-500" : theftRate > 0.22 ? "bg-yellow-500" : "bg-green-500",
      }
    });
  }, [seasonHeat])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Visualize trends and KPIs</p>
        </div>
        {/* These filters are not connected yet, they are for future improvement */}
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
            <CardDescription>Total kWh by month (Last 12 Months)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyConsumption}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="kwh" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="h-5 w-5" />
              Anomalies per Month
            </CardTitle>
            <CardDescription>Detected anomalies by month (Last 12 Months)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={anomaliesPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="anomalies" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Season vs Anomaly Rate</CardTitle>
            <CardDescription>Relative anomaly percentage by season</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[120px] w-full" />
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {heatCells.map((c) => (
                  <div key={c.season} className="p-3 rounded-md border text-white">
                    <div className={`w-full h-16 rounded ${c.color}`} />
                    <div className="mt-2 text-sm text-foreground">{c.season} — {(c.theftRate * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Power Factor vs Billing (Scatter)</CardTitle>
            <CardDescription>Distribution of bills vs PF (100 random samples)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="pf" name="Power Factor" domain={[0.5, 1]} />
                  <YAxis type="number" dataKey="billing" name="Billing (Est.)" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={pfBilling} fill="#a855f7" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}