// FILE: app/admin/data-upload/page.tsx
"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, File } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import Papa from 'papaparse'

interface CsvData {
  RRNO: string; // From TestingSet.csv
  date: string; // From TestingSet.csv
  [key: string]: any; 
}

export default function DataUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0]
      setFile(selectedFile)
      setFileName(selectedFile.name)
    }
  }

  const handleUpload = () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a file.", variant: "destructive" })
      return
    }
    setLoading(true)

    Papa.parse<CsvData>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        
        // This filter is now correct for your TestingSet.csv file
        const jsonData = results.data.filter(row => row.RRNO && row.RRNO.trim() !== '');

        if (jsonData.length === 0) {
          toast({ title: "Error", description: "The CSV file is empty or contains no valid data.", variant: "destructive" })
          setLoading(false)
          return;
        }

        try {
          // This API expects the body to be a RAW ARRAY
          const response = await fetch('/api/admin/datasets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonData), 
          })

          const result = await response.json()
          if (!response.ok) {
            throw new Error(result.error || 'Failed to upload data')
          }

          toast({
            title: "Success!",
            description: `${result.count} records have been successfully uploaded.`,
            variant: "default",
          })
          setFile(null)
          setFileName('')

        } catch (error: any) {
          toast({ title: "Upload Failed", description: error.message, variant: "destructive" })
        } finally {
          setLoading(false)
        }
      },
      error: (error: any) => {
        setLoading(false)
        toast({ title: "Parsing Error", description: "Failed to read the CSV file.", variant: "destructive" })
      }
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Consumer Data</CardTitle>
          <CardDescription>Upload a CSV file containing consumer electricity usage data.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ... Your JSX for the upload form ... (no changes here) */}
          <div className="grid gap-6">
            <div className="grid w-full max-w-sm items-center gap-2">
              <Label htmlFor="csv-upload" className="font-semibold">Select CSV File</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file:text-sm file:font-medium"
              />
            </div>
            {fileName && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <File className="h-4 w-4" />
                <span>{fileName}</span>
              </div>
            )}
            <Button onClick={handleUpload} disabled={loading || !file} className="w-full max-w-sm">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}