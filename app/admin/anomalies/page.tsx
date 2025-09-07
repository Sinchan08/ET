"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Filter, FileText, Eye, CheckCircle2, AlertTriangle, StickyNote } from 'lucide-react'
import { exportToCsv, printElementAsPDF } from "@/lib/export"
import { useToast } from "@/hooks/use-toast"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

type Anomaly = {
  id: string
  rrno: string
  name?: string
  village?: string
  address?: string
  date: string
  consumption: number
  voltage: number
  status: "theft" | "suspicious" | "normal"
  confidence: number
  anomaly_type?: string
  notes?: string[]
}

const mockSeries = (base = 250) =>
  Array.from({ length: 14 }).map((_, i) => ({
    day: `D${i + 1}`,
    consumption: Math.max(120, Math.round(base + (Math.random() - 0.5) * 120)),
  }))

export default function AnomaliesPage() {
  const { toast } = useToast()
  const [list, setList] = useState<Anomaly[]>([])
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState<Anomaly | null>(null)
  const [note, setNote] = useState("")

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/admin/anomalies")
      const data = await res.json()
      setList(data.anomalies || [])
    })()
  }, [])

  const filtered = useMemo(
    () => list.filter((a) => filter === "all" || a.status === filter),
    [list, filter]
  )

  const statusBadge = (s: Anomaly["status"]) =>
    s === "theft" ? (
      <Badge variant="destructive">Theft</Badge>
    ) : s === "suspicious" ? (
      <Badge className="bg-yellow-100 text-yellow-800">Suspicious</Badge>
    ) : (
      <Badge className="bg-green-100 text-green-800">Normal</Badge>
    )

  const addNote = async () => {
    if (!selected || !note.trim()) return
    const res = await fetch("/api/admin/anomalies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-note", id: selected.id, note }),
    })
    if (res.ok) {
      const data = await res.json()
      setList((prev) => prev.map((x) => (x.id === selected.id ? data.anomaly : x)))
      setSelected(data.anomaly)
      setNote("")
      toast({ title: "Note added" })
    }
  }

  const markFalsePositive = async () => {
    if (!selected) return
    const res = await fetch("/api/admin/anomalies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-status", id: selected.id, status: "normal" }),
    })
    if (res.ok) {
      const data = await res.json()
      setList((prev) => prev.map((x) => (x.id === selected.id ? data.anomaly : x)))
      setSelected(data.anomaly)
      toast({ title: "Marked as false positive" })
    }
  }

  const exportPdf = () => {
    printElementAsPDF("anomaly-detail")
  }

  const exportListCsv = () => {
    exportToCsv("anomalies.csv", filtered)
  }

  const shap = [
    { feature: "consumption_spike", impact: +0.35 },
    { feature: "low_voltage", impact: +0.22 },
    { feature: "power_factor", impact: +0.10 },
    { feature: "billing_mismatch", impact: +0.08 },
  ]

  const ruleJustification = [
    "Consumption exceeded 2.0x rolling average",
    "Voltage below 200V on multiple consecutive days",
    "Power factor below 0.7 threshold",
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anomaly Reports</h1>
          <p className="text-muted-foreground">Investigate detected anomalies, add notes and export</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportListCsv}>
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
          <CardDescription>Filter by status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "normal" ? "default" : "outline"} onClick={() => setFilter("normal")}>Normal</Button>
          <Button variant={filter === "suspicious" ? "default" : "outline"} onClick={() => setFilter("suspicious")}>Suspicious</Button>
          <Button variant={filter === "theft" ? "default" : "outline"} onClick={() => setFilter("theft")}>Theft</Button>
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
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono">{a.rrno}</TableCell>
                <TableCell>{a.date}</TableCell>
                <TableCell>{a.village}</TableCell>
                <TableCell>{a.consumption}</TableCell>
                <TableCell>{a.voltage}</TableCell>
                <TableCell>{statusBadge(a.status)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelected(a)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No anomalies</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <Card id="anomaly-detail" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anomaly Detail - {selected.id}
            </CardTitle>
            <CardDescription>RRNO: {selected.rrno} • {selected.village} • {selected.date}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">User Information</h4>
                <div className="text-sm space-y-1">
                  <div>Name: <span className="font-semibold">{selected.name || "—"}</span></div>
                  <div>RRNO: <span className="font-mono">{selected.rrno}</span></div>
                  <div>Address: {selected.address || "—"}</div>
                  <div>Village: {selected.village || "—"}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <div className="flex items-center gap-2">
                  {statusBadge(selected.status)}
                  <Badge variant="secondary">Confidence: {(selected.confidence * 100).toFixed(1)}%</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Consumption Trend</h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={mockSeries(selected.consumption)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">SHAP Explanation</h4>
                <div className="space-y-2">
                  {shap.map((s) => (
                    <div key={s.feature} className="flex items-center gap-2">
                      <div className="w-36 text-sm">{s.feature}</div>
                      <div className="flex-1 bg-muted h-2 rounded">
                        <div className="h-2 rounded bg-purple-500" style={{ width: `${Math.abs(s.impact) * 100}%` }} />
                      </div>
                      <div className="text-xs w-10 text-right">{(s.impact * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Rule-based Justification</h4>
                <ul className="list-disc pl-5 text-sm">
                  {ruleJustification.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" onClick={() => exportToCsv(`anomaly_${selected.id}.csv`, [selected])}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportPdf}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="destructive" onClick={markFalsePositive}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as False Positive
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2"><StickyNote className="h-4 w-4" /> Notes</h4>
              <div className="grid gap-2 md:grid-cols-4">
                <div className="md:col-span-3">
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a manual note..." />
                </div>
                <div className="flex items-start">
                  <Button onClick={addNote}>Add Note</Button>
                </div>
              </div>
              <div className="text-sm space-y-1">
                {(selected.notes || []).map((n, i) => (
                  <div key={i} className="p-2 rounded border">{n}</div>
                ))}
                {(!selected.notes || selected.notes.length === 0) && (
                  <div className="text-muted-foreground text-sm">No notes yet</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
