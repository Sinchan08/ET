"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Zap, AlertCircle } from 'lucide-react'

// Define the structure of your data
interface DataRecord {
  id: number;
  rrno: string;
  village: string;
  record_date: string;
  consumption: number;
  voltage: number;
  is_anomaly: boolean;
  confidence: number;
}

export default function PredictionsPage() {
  const [data, setData] = useState<DataRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const { toast } = useToast()

  // Function to fetch data from our new GET endpoint
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/predictions');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const records = await response.json();
      setData(records);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not fetch data from database.",
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  }

  // Fetch data when the page loads
  useEffect(() => {
    fetchData();
  }, [])

  // Function to run the prediction model
  const handleRunPrediction = async () => {
    setPredicting(true);
    try {
      const response = await fetch('/api/predictions', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Prediction failed');
      }

      toast({
        title: "Prediction Complete",
        description: `Model processed ${result.total_records} records. ${result.anomalies_found} anomalies found.`,
      })
      
      // Refresh the data in the table to show the new results
      fetchData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not run prediction.",
        variant: "destructive",
      })
    } finally {
      setPredicting(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Run Predictions</CardTitle>
            <CardDescription>
              View uploaded data and run the ML model to detect anomalies.
            </CardDescription>
          </div>
          <Button onClick={handleRunPrediction} disabled={predicting}>
            {predicting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running Model...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" /> Run Prediction Model
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RR No.</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Consumption</TableHead>
                <TableHead>Voltage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading data...</TableCell>
                </TableRow>
              ) : data.map((record) => (
                <TableRow key={record.id} className={record.is_anomaly ? 'bg-red-100 dark:bg-red-900/30' : ''}>
                  <TableCell>{record.rrno}</TableCell>
                  <TableCell>{record.village}</TableCell>
                  <TableCell>{formatDate(record.record_date)}</TableCell>
                  <TableCell>{record.consumption}</TableCell>
                  <TableCell>{record.voltage}</TableCell>
                  <TableCell>
                    {record.is_anomaly ? (
                      <Badge variant="destructive" className="flex items-center w-fit">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Anomaly
                      </Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}