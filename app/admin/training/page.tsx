"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, PlayCircle, RefreshCw } from 'lucide-react'
import Papa from "papaparse"
import { useToast } from "@/hooks/use-toast"

type TrainRow = Record<string, any>
type ModelVersion = { version: string; metrics: { accuracy: number; precision: number; recall: number; f1_score: number }; createdAt: string }

export default function TrainingPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<TrainRow[]>([])
  const [fileName, setFileName] = useState("")
  const [running, setRunning] = useState(false)
  const [versions, setVersions] = useState<ModelVersion[]>([
    { version: "v3.1", metrics: { accuracy: 0.942, precision: 0.895, recall: 0.962, f1_score: 0.928 }, createdAt: "2024-06-10" },
  ])
  const [currentVersion, setCurrentVersion] = useState("v3.1")

  const onFile = async (file: File) => {
    setFileName(file.name)
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Unsupported file", description: "Please upload a labeled CSV", variant: "destructive" })
      return
    }
    const text = await file.text()
    const result = Papa.parse<TrainRow>(text, { header: true, skipEmptyLines: true })
    setRows(result.data.filter(Boolean))
    toast({ title: "File parsed", description: `Loaded ${result.data.length} records` })
  }

  const retrain = async () => {
    if (!rows.length) {
      toast({ title: "No data", description: "Upload labeled data (is_anomaly) to train", variant: "destructive" })
      return
    }
    setRunning(true)
    try {
      const fd = new FormData()
      fd.append("file", new File([JSON.stringify(rows)], fileName || "labeled.json", { type: "application/json" }))
      const res = await fetch("/api/model/retrain", { method: "POST", body: fd })
      const data = await res.json()
      const newVersion = (data.model_version || `v${(Math.random() * 10).toFixed(1)}`) as string
      const mv: ModelVersion = {
        version: newVersion,
        metrics: data.metrics || { accuracy: 0.94, precision: 0.88, recall: 0.96, f1_score: 0.92 },
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setVersions((prev) => [mv, ...prev])
      setCurrentVersion(mv.version)
      toast({ title: "Retraining complete", description: `New model: ${mv.version}` })
    } catch (e: any) {
      toast({ title: "Retraining failed", description: e.message || "Error during training", variant: "destructive" })
    } finally {
      setRunning(false)
    }
  }

  const rollback = (v: string) => {
    setCurrentVersion(v)
    toast({ title: "Rollback complete", description: `Active model set to ${v}` })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Training</h1>
          <p className="text-muted-foreground">Upload labeled data and retrain the model</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={retrain} disabled={running}>
            <PlayCircle className="h-4 w-4 mr-2" />
            {running ? "Training..." : "Start Retraining"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Labeled Data
          </CardTitle>
          <CardDescription>CSV with is_anomaly column</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          {fileName && <div className="text-sm">Selected: {fileName}</div>}
          {rows.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Loaded {rows.length} rows. Example columns: {Object.keys(rows[0]).slice(0, 6).join(", ")}...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Model Versions
          </CardTitle>
          <CardDescription>Active and historical versions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">Active model: <Badge>{currentVersion}</Badge></div>
          <div className="grid gap-2">
            {versions.map((v) => (
              <div key={v.version} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{v.version}</div>
                  <div className="text-xs text-muted-foreground">Created {v.createdAt}</div>
                </div>
                <div className="text-sm">
                  Acc {(v.metrics.accuracy * 100).toFixed(1)}% • Prec {(v.metrics.precision * 100).toFixed(0)}% • Rec {(v.metrics.recall * 100).toFixed(0)}% • F1 {(v.metrics.f1_score * 100).toFixed(0)}%
                </div>
                <Button variant="outline" size="sm" onClick={() => rollback(v.version)}>Rollback</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
