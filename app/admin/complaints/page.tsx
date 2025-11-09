// FILE: app/admin/complaints/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button" // Import Button
import { useToast } from "@/hooks/use-toast"
import { FileText, AlertCircle, CheckCircle, CheckSquare } from 'lucide-react' // Import CheckSquare

// Define the structure of a complaint
interface Complaint {
  id: number;
  subject: string;
  description: string;
  status: 'submitted' | 'resolved';
  created_at: string;
  user_name: string;
  user_email: string;
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Function to fetch all complaints
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/complaints'); 
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      const data = await response.json();
      setComplaints(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not fetch complaints.",
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  }

  // Fetch data when the page loads
  useEffect(() => {
    fetchComplaints();
  }, [])

  // --- NEW FUNCTION TO HANDLE RESOLVING A COMPLAINT ---
  const handleResolve = async (complaintId: number) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH', // Use PATCH to update
      });

      if (!response.ok) {
        throw new Error('Failed to resolve complaint');
      }

      toast({
        title: "Success",
        description: "Complaint marked as resolved.",
      });

      // Refresh the table to show the new "Resolved" status
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Complaints</CardTitle>
          <CardDescription>
            View and resolve user-submitted complaints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading complaints...</TableCell>
                </TableRow>
              ) : complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No complaints found.</TableCell>
                </TableRow>
              ) : (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      {complaint.status === 'submitted' ? (
                        <Badge variant="destructive" className="flex items-center w-fit">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Submitted
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center w-fit">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Resolved
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{complaint.user_name}</div>
                      <div className="text-sm text-muted-foreground">{complaint.user_email}</div>
                    </TableCell>
                    <TableCell>{complaint.subject}</TableCell>
                    <TableCell>{formatDate(complaint.created_at)}</TableCell>
                    <TableCell>
                      {/* --- ADDED THIS BUTTON --- */}
                      {complaint.status === 'submitted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(complaint.id)}
                        >
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Mark as Resolved
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}