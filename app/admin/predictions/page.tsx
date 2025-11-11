// FILE: app/admin/predictions/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Zap, AlertCircle } from 'lucide-react'
// --- IMPORT PAGINATION COMPONENTS ---
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

// Define the structure of your data
interface DataRecord {
  id: number;
  rrno: string;
  village: string;
  record_date: string;
  consumption: number; // Assuming this is "Consumption" from DB
  voltage: number;     // Assuming this is "Voltage" from DB
  is_anomaly: boolean;
  confidence: number;
}

export default function PredictionsPage() {
  const [data, setData] = useState<DataRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const { toast } = useToast()

  // --- ADD PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  // Function to fetch data from our new paginated GET endpoint
  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      // --- Fetch the specific page ---
      const response = await fetch(`/api/predictions?page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      
      // The API now returns an object { records, totalPages }
      setData(data.records);
      setTotalPages(data.totalPages);
      setCurrentPage(page);

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

  // Fetch data when the page loads (or when currentPage changes)
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]) // Re-run when currentPage changes

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
        description: `Model processed ${result.total_records} records. ${result.anomalies_found} anomalies found. Rules breached: ${result.rules_breached}.`,
      })
      
      // Refresh the data in the table (go back to page 1 to see new results)
      if (currentPage === 1) {
        fetchData(1); // Already on page 1, just refetch
      } else {
        setCurrentPage(1); // This will trigger the useEffect to refetch page 1
      }

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

  // --- PAGINATION HANDLERS ---
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }
  
  // --- FUNCTION TO RENDER PAGINATION BUTTONS ---
  const renderPagination = () => {
    if (totalPages <= 1) return null;

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

    if (startPage > 1) {
      pageNumbers.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        pageNumbers.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={i === currentPage} 
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
      }
      pageNumbers.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(currentPage - 1)} 
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {pageNumbers}
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(currentPage + 1)}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
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
                <TableHead>Address</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Consumption</TableHead>
                <TableHead>Voltage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">Loading data...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">No data found.</TableCell>
                </TableRow>
              ) : (
                data.map((record) => (
                  <TableRow key={record.id} className={record.is_anomaly ? 'bg-red-100 dark:bg-red-900/30' : ''}>
                    <TableCell>{record.rrno}</TableCell>
                    <TableCell>{record.village}</TableCell> {/* Note: This is 'village' from your DB */}
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
                ))
              )}
            </TableBody>
          </Table>
          
          {/* --- ADD THE PAGINATION CONTROLS --- */}
          <div className="mt-4">
            {renderPagination()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}