// FILE: app/user/complaints/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Trash2 } from "lucide-react" // <-- 1. IMPORT Trash2
import { useAuth } from "@/components/auth/auth-provider"

// Define the complaint structure
interface Complaint {
  id: number;
  subject: string;
  description: string;
  status: 'submitted' | 'resolved';
  created_at: string;
}

export default function ComplaintsPage() {
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  // Function to fetch this user's complaints
  const fetchComplaints = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${user.id}/complaints`); 
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      const data = await response.json();
      setComplaints(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) {
      toast({ title: "Error", description: "Please fill out all fields.", variant: "destructive" });
      return;
    }
    
    if (!user || !user.rrno) { 
      toast({ title: "Error", description: "User data is missing. Please log in again.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          description,
          type: "Billing", 
          rrno: user.rrno, 
          userId: user.id  
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit complaint');
      }

      toast({ title: "Success", description: "Your complaint has been submitted." });
      setSubject("");
      setDescription("");
      fetchComplaints(); // Refresh the list
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  // --- 2. ADD THE NEW handleDelete FUNCTION ---
  const handleDelete = async (complaintId: number) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this complaint?")) {
      return;
    }

    try {
      // This is the new, correct URL, and we no longer need the 'body'
      const response = await fetch(`/api/user/${user.id}/complaints/${complaintId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete complaint');
      }

      toast({ title: "Success", description: "Complaint has been deleted." });
      fetchComplaints(); // Refresh the list
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>File a New Complaint</CardTitle>
            <CardDescription>
              Have an issue with your billing or service? Let us know.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Overbilling in October"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide all the details about your issue."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Submit Complaint</Button>
            </CardFooter>
          </form>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>My Complaint History</CardTitle>
            <CardDescription>
              A log of your past and active complaints.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                {/* --- 3. ADD "Actions" HEADER --- */}
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                ) : complaints.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center">No complaints submitted.</TableCell></TableRow>
                ) : (
                  complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>{formatDate(complaint.created_at)}</TableCell>
                      <TableCell className="font-medium">{complaint.subject}</TableCell>
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
                      {/* --- 4. ADD DELETE BUTTON (only if 'submitted') --- */}
                      <TableCell>
                        {complaint.status === 'submitted' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(complaint.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  )
}