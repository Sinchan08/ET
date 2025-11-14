// FILE: app/admin/anomalies/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Filter, FileText, Eye, CheckCircle2, AlertTriangle, StickyNote } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

type Anomaly = {
  id: number // It's a number from the DB
  rrno: string
  name?: string
  village?: string
  address?: string
  record_date: string
  Consumption: number
  Voltage: number
  status: "theft" | "suspicious" | "normal"
  confidence: number
  anomaly_reason: string | null
  notes?: string[]
}

const mockSeries = (base = 250) =>
  Array.from({ length: 14 }).map((_, i) => ({
    day: `D${i + 1}`,
    consumption: Math.max(120, Math.round(base + (Math.random() - 0.5) * 120)),
  }))

function buildPagination(currentPage: number, totalPages: number) {
  const pageNumbers = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) {
    endPage = Math.min(totalPages, maxPagesToShow);
  }
  if (currentPage > totalPages - 3) {
    startPage = Math.max(1, totalPages - maxPagesToShow + 1);
  }
  return { startPage, endPage };
}

export default function AnomaliesPage() {
  const { toast } = useToast()
  const [list, setList] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState<Anomaly | null>(null)
  const [note, setNote] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)

  const fetchAnomalies = async (page: number) => {
    setLoading(true);
    setSelected(null); 
    try {
      const res = await fetch(`/api/admin/anomalies?page=${page}`)
      if (!res.ok) {
        throw new Error("Failed to fetch anomalies");
      }
      const data = await res.json()
      setList(data.anomalies || [])
      setTotalPages(data.totalPages || 0);
      setTotalRecords(data.totalRecords || 0);
      setCurrentPage(page);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnomalies(currentPage);
  }, [currentPage, toast]) // Added toast dependency

  const filteredList = useMemo(
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
    toast({ title: "Note added (simulated)", description: note });
    setNote("");
  }

  const markFalsePositive = async () => {
    if (!selected) return
    try {
      const res = await fetch("/api/admin/anomalies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-status", id: selected.id, status: "normal" }),
      })
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      setSelected(null)
      toast({ title: "Marked as false positive" })
      fetchAnomalies(currentPage);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  const exportPdf = () => toast({ title: "PDF Export (Simulated)" });
  const exportListCsv = () => toast({ title: "CSV Export (Simulated)" });

  const ruleJustification = useMemo(() => {
    if (!selected) return [];
    if (selected.anomaly_reason) {
      return [selected.anomaly_reason];
    }
    return ["No specific reason logged."];
  }, [selected])

  const shap = [
    { feature: "consumption_spike", impact: +0.35 },
    { feature: "low_voltage", impact: +0.22 },
  ]
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }

  const { startPage, endPage } = buildPagination(currentPage, totalPages);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anomaly Reports</h1>
          <p className="text-muted-foreground">
            Investigating {totalRecords} total anomalies. 
            Page {currentPage} of {totalPages}.
          </p>
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
          <CardDescription>
            Filter by status (filtering only applies to the current page).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All ({list.length})</Button>
          <Button variant={filter === "suspicious" ? "default" : "outline"} onClick={() => setFilter("suspicious")}>Suspicious ({list.filter(a => a.status === 'suspicious').length})</Button>
          <Button variant={filter === "theft" ? "default" : "outline"} onClick={() => setFilter("theft")}>Theft ({list.filter(a => a.status === 'theft').length})</Button>
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
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          {/* --- WHITESPACE IS REMOVED HERE --- */}
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">Loading anomalies...</TableCell></TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">No anomalies found on this page.</TableCell></TableRow>
            ) : (
              filteredList.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono">{a.rrno}</TableCell>
                  <TableCell>{formatDate(a.record_date)}</TableCell>
                  <TableCell>{a.village}</TableCell>
                  <TableCell>{a.Consumption}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.anomaly_reason || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setSelected(a)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(currentPage - 1)} 
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {startPage > 1 && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
              </PaginationItem>
            )}
            {startPage > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}

            {Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i).map(page => (
              <PaginationItem key={page}>
                <PaginationLink 
                  isActive={page === currentPage} 
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {endPage < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
            {endPage < totalPages && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* --- Detail View (Modal) --- */}
      {selected && (
        <Card id="anomaly-detail" className="mt-6 border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anomaly Detail - ID: {selected.id}
            </CardTitle>
            <CardDescription>RRNO: {selected.rrno} • {selected.village} • {formatDate(selected.record_date)}</CardDescription>
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
              <h4 className="font-medium mb-2">Consumption Trend (Mock Data)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={mockSeries(selected.Consumption)}>
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
                <h4 className="font-medium mb-2">SHAP Explanation (Mock Data)</h4>
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
                <h4 className="font-medium mb-2">Justification (Real Data)</h4>
                <ul className="list-disc pl-5 text-sm">
                  {ruleJustification.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" onClick={() => exportListCsv()}>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}