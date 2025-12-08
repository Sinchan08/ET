"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, CheckSquare, RefreshCw } from 'lucide-react'

interface Complaint {
  id: number;
  subject: string;
  description: string;
  status: 'submitted' | 'resolved';
  created_at: string;
  user_name: string;
  user_email: string;
  rrno: string;
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/complaints', { cache: 'no-store' }); // Ensure fresh data
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      const data = await response.json();
      console.log("Fetched complaints data:", data); // Debug log to browser console
      setComplaints(data);
    } catch (error: any) {
      console.error("Error fetching:", error);
      toast({
        title: "Error",
        description: error.message || "Could not fetch complaints.",
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, [])

  const handleResolve = async (complaintId: number) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to resolve complaint');
      }

      toast({
        title: "Success",
        description: "Complaint marked as resolved.",
      });

      fetchComplaints(); 

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not resolve complaint.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Complaints</h2>
          <p className="text-muted-foreground">Manage and resolve user issues.</p>
        </div>
        <Button variant="outline" onClick={fetchComplaints}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Complaints</CardTitle>
          <CardDescription>
            A list of all complaints submitted by users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>User Details</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading complaints...
                    </TableCell>
                  </TableRow>
                ) : complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No complaints found in the database.
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        {complaint.status === 'submitted' ? (
                          <Badge variant="destructive" className="flex items-center w-fit gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Open
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center w-fit gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3" />
                            Resolved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{complaint.user_name || "Unknown User"}</span>
                          <span className="text-xs text-muted-foreground">{complaint.user_email}</span>
                          <span className="text-xs text-muted-foreground font-mono">RR: {complaint.rrno}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-[300px]">
                          <span className="font-medium truncate" title={complaint.subject}>{complaint.subject}</span>
                          <span className="text-xs text-muted-foreground truncate" title={complaint.description}>{complaint.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(complaint.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {complaint.status === 'submitted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleResolve(complaint.id)}
                          >
                            <CheckSquare className="mr-2 h-4 w-4 text-green-600" />
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}