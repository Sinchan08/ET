"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Database } from 'lucide-react'
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"

type Row = Record<string, any>

const REQUIRED_COLUMNS = ["RRNO", "date"]

export default function DataUploadPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [valid, setValid] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [fileName, setFileName] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback(async (file: File) => {
    setFileName(file.name)
    const ext = file.name.toLowerCase().split(".").pop()
    try {
      if (ext === "csv") {
        const text = await file.text()
        const result = Papa.parse<Row>(text, { header: true, skipEmptyLines: true })
        const rowsParsed = result.data.filter(Boolean)
        setRows(rowsParsed)
        setHeaders(result.meta.fields || [])
      } else if (ext === "xlsx" || ext === "xls") {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data)
        const wsName = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsName]
        const json: Row[] = XLSX.utils.sheet_to_json(ws, { defval: "" })
        setRows(json)
        setHeaders(Object.keys(json[0] || {}))
      } else {
        throw new Error("Unsupported file type. Please upload .csv or .xlsx")
      }
      toast({ title: "File parsed", description: "Preview generated." })
    } catch (e: any) {
      console.error(e)
      toast({ title: "Parse failed", description: e.message || "Unable to parse file", variant: "destructive" })
      setRows([])
      setHeaders([])
    }
  }, [toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onDrop(file)
  }

  const missingColumns = useMemo(
    () => REQUIRED_COLUMNS.filter((c) => !headers.map((h) => h.toLowerCase()).includes(c.toLowerCase())),
    [headers]
  )

  const validate = () => {
    if (rows.length === 0) {
      setValid(false)
      return
    }
    const hasRequired = missingColumns.length === 0
    setValid(hasRequired)
    if (hasRequired) {
      toast({ title: "Validation passed", description: "Required fields present." })
    } else {
      toast({
        title: "Validation failed",
        description: `Missing: ${missingColumns.join(", ")}`,
        variant: "destructive",
      })
    }
  }

  const saveToDatabase = async () => {
    if (!valid) {
      toast({ title: "Validate first", description: "Please validate before saving.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/datasets", {
        method: "POST",
        body: JSON.stringify({ name: fileName || "dataset.csv", rows }),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to save dataset")
      const data = await res.json()
      toast({
        title: "Saved",
        description: `Saved ${data.count} records as ${data.dataset?.name}`,
      })
      setRows([])
      setHeaders([])
      setFileName("")
      setValid(null)
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message || "Error while saving", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Upload</h1>
        <p className="text-muted-foreground">Upload .csv/.xlsx datasets, validate, preview and save.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Dataset
          </CardTitle>
          <CardDescription>Supports .csv and .xlsx files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files?.[0]
              if (f) onDrop(f)
            }}
            className="border-2 border-dashed rounded-md p-8 text-center hover:bg-muted/30 transition-colors"
          >
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="mb-2">Drag & drop your file here</p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              Choose File
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            {fileName && <p className="mt-3 text-sm">Selected: {fileName}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={validate} disabled={!rows.length}>
              Validate Fields
            </Button>
            <Button onClick={saveToDatabase} disabled={!rows.length || !valid || saving}>
              <Database className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save to Database"}
            </Button>
            {valid === true && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Valid
              </Badge>
            )}
            {valid === false && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Invalid
              </Badge>
            )}
          </div>

          {missingColumns.length > 0 && rows.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Missing required: {missingColumns.join(", ")}</AlertDescription>
            </Alert>
          )}

          {rows.length > 0 && (
            <div className="mt-4 overflow-auto border rounded-md">
              <table className="min-w-[700px] w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 25).map((r, i) => (
                    <tr key={i} className="border-t">
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2">{String(r[h] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-xs text-muted-foreground p-2">
                Showing {Math.min(25, rows.length)} of {rows.length} rows
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
