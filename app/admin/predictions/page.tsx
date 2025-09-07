"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, PlayCircle, Filter, Flag, Search } from 'lucide-react'
import { exportToCsv } from "@/lib/export"
import { useToast } from "@/hooks/use-toast"

type RecordRow = {
  id: string
  rrno: string
  village: string
  date: string
  consumption: number
  voltage: number
  is_anomaly?: 0 | 1
  anomaly_type?: string
  risk_level?: "low" | "medium" | "high"
  status?: "normal" | "suspicious" | "theft"
  confidence?: number
}

const SAMPLE: RecordRow[] = [
  { id: "r1", rrno: "RR1001", village: "Ankola", date: "2024-01-01", consumption: 245, voltage: 230 },
  { id: "r2", rrno: "RR1001", village: "Ankola", date: "2024-01-02", consumption: 412, voltage: 210 },
  { id: "r3", rrno: "RR2002", village: "Belambar", date: "2024-01-01", consumption: 320, voltage: 220 },
  { id: "r4", rrno: "RR2002", village: "Belambar", date: "2024-01-03", consumption: 280, voltage: 232 },
]

function StatusBadge({ status }: { status?: string }) {
  if (status === "theft")
    return <Badge variant="destructive">🟥 Theft</Badge>
  if (status === "suspicious")
    return <Badge className="bg-yellow-100 text-yellow-800">🟨 Suspicious</Badge>
  return <Badge className="bg-green-100 text-green-800">🟩 Normal</Badge>
}

export default function PredictionsPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<RecordRow[]>([])
  const [filters, setFilters] = useState({ rrno: "", village: "all", status: "all" })
  const [running, setRunning] = useState(false)

  useEffect(() => {
    // Load initial sample
    setRows(SAMPLE)
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchRrno = !filters.rrno || r.rrno.toLowerCase().includes(filters.rrno.toLowerCase())
      const matchVillage = filters.village === "all" || r.village === filters.village
      const matchStatus = filters.status === "all" || (r.status || "normal") === filters.status
      return matchRrno && matchVillage && matchStatus
    })
  }, [rows, filters])

  const villages = useMemo(() => Array.from(new Set(rows.map((r) => r.village))), [rows])

  const runPrediction = async () => {
    setRunning(true)
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows.map(({ id, ...rest }) => rest)),
      })
      const data = await res.json()
      if (!data?.predictions) throw new Error("Prediction failed")
      const mapped = data.predictions.map((p: any, idx: number) => {
        const id = rows[idx]?.id || `row_${idx}`
        const status: "normal" | "suspicious" | "theft" = p.is_anomaly ? (p.risk_level === "high" ? "theft" : "suspicious") : "normal"
        return { id, ...p, status }
      })
      setRows(mapped)
      toast({ title: "Predictions completed", description: `Processed ${mapped.length} records` })
    } catch (e: any) {
      toast({ title: "Prediction error", description: e.message || "Failed to run model", variant: "destructive" })
    } finally {
      setRunning(false)
    }
  }

  const manualFlag = (id: string, status: "normal" | "suspicious" | "theft") => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  const exportCsv = () => {
    exportToCsv("predictions.csv", filtered)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictions</h1>
          <p className="text-muted-foreground">Run model predictions and manage results</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runPrediction} disabled={running}>
            <PlayCircle className="h-4 w-4 mr-2" />
            {running ? "Running..." : "Run Prediction"}
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter by RRNO, village and status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="RRNO..."
              value={filters.rrno}
              onChange={(e) => setFilters((f) => ({ ...f, rrno: e.target.value }))}
              className="w-40"
            />
          </div>
          <Select value={filters.village} onValueChange={(v) => setFilters((f) => ({ ...f, village: v }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Village" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Villages</SelectItem>
              {villages.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="suspicious">Suspicious</SelectItem>
              <SelectItem value="theft">Theft</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RRNO</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Consumption</TableHead>
              <TableHead>Voltage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono">{r.rrno}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.village}</TableCell>
                <TableCell>{r.consumption}</TableCell>
                <TableCell>{r.voltage}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => manualFlag(r.id, "normal")}>Normal</Button>
                    <Button variant="outline" size="sm" onClick={() => manualFlag(r.id, "suspicious")}>Suspicious</Button>
                    <Button variant="destructive" size="sm" onClick={() => manualFlag(r.id, "theft")}>
                      <Flag className="h-3 w-3 mr-1" /> Theft
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  No records
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
