// FILE: app/user/reports/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, Search, Eye, FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider" // <-- 1. IMPORT useAuth

interface ConsumptionData {
  date: string;
  consumption: number;
  voltage: number;
}

// 2. UPDATE UserReport interface to match our API
interface UserReport {
  id: string;
  rrno: string;
  name: string;
  address: string;
  village: string;
  date_range: string;
  consumption_data: ConsumptionData[];
  anomaly_status: "normal" | "suspicious" | "theft";
  total_consumption: number;
  avg_consumption: number;
  billing_amount: number;
  confidence_score: number;
  created_at: string;
}

// 3. REMOVED mockReports ARRAY

export default function UserReportsPage() {
  const { toast } = useToast()
  const { user } = useAuth() // <-- 4. GET THE LOGGED-IN USER
  const [reports, setReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    dateRange: "all",
  })

  // 5. UPDATE loadReports to fetch from our new API
  const loadReports = async () => {
    if (!user) return; // Wait for user to be loaded
    
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${user.id}/reports`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await response.json();
      setReports(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not fetch reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [user]) // <-- 6. Re-run when 'user' is available

  const downloadReport = async (report: UserReport) => {
    try {
      toast({
        title: "Download started",
        description: `Downloading report for ${report.date_range}`,
      })
      // Simulate PDF download
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the report",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Normal
          </Badge>
        )
      case "suspicious":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Suspicious
          </Badge>
        )
      case "theft":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Theft Detected
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.date_range.toLowerCase().includes(filters.search.toLowerCase()) ||
      report.village.toLowerCase().includes(filters.search.toLowerCase())
    const matchesStatus = filters.status === "all" || report.anomaly_status === filters.status
    return matchesSearch && matchesStatus
  })

  if (loading && reports.length === 0) { // Only show full-page loader on first load
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading your reports...</span>
      </div>
    )
  }
  
  // 7. (Minor change) Calculate stats from 'reports' state
  const totalReports = reports.length;
  const normalReports = reports.filter(r => r.anomaly_status === "normal").length;
  const suspiciousReports = reports.filter(r => r.anomaly_status === "suspicious").length;
  const avgConsumption = totalReports > 0 
    ? Math.round(reports.reduce((acc, r) => acc + r.avg_consumption, 0) / totalReports)
    : 0;


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
          <p className="text-muted-foreground">View your electricity consumption reports and analysis</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Normal Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {normalReports}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {suspiciousReports}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {avgConsumption} kWh
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search by date range or village..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-64"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
                <SelectItem value="theft">Theft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-6">
        {filteredReports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Report - {report.date_range}
                  </CardTitle>
                  <CardDescription>
                    RRNO: {report.rrno} • {report.village} • Generated on {new Date(report.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(report.anomaly_status)}
                  <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadReport(report)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Consumption Overview</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Consumption:</span>
                      <span className="font-semibold">{report.total_consumption.toFixed(2)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Daily:</span>
                      <span className="font-semibold">{report.avg_consumption.toFixed(2)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billing Amount (Est.):</span>
                      <span className="font-semibold">₹{report.billing_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence Score:</span>
                      <span className="font-semibold">{(report.confidence_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Usage Trend</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={report.consumption_data}>
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No reports found</h3>
            <p className="text-muted-foreground">Try adjusting your search filters or check back later.</p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Report Modal/View */}
      {selectedReport && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Detailed Analysis - {selectedReport.date_range}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                Close Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-semibold">{selectedReport.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RRNO:</span>
                    <span className="font-mono">{selectedReport.rrno}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Address:</span>
                    <span className="text-right">{selectedReport.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Village:</span>
                    <span>{selectedReport.village}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Analysis Results</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    {getStatusBadge(selectedReport.anomaly_status)}
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <span className="font-semibold">{(selectedReport.confidence_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Report Date:</span>
                    <span>{new Date(selectedReport.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-3">Daily Consumption & Voltage</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={selectedReport.consumption_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="consumption"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Consumption (kWh)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="voltage"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Voltage (V)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}