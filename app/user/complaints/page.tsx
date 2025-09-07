"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Clock, CheckCircle, AlertTriangle, MessageSquare, Calendar } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface Complaint {
  id: string
  rrno: string
  type: string
  subject: string
  description: string
  status: "submitted" | "in_review" | "resolved" | "closed"
  priority: "low" | "medium" | "high"
  related_report_id?: string
  related_date?: string
  created_at: string
  updated_at: string
  resolution?: string
}

const mockComplaints: Complaint[] = [
  {
    id: "comp_001",
    rrno: "RR1001",
    type: "High Bill",
    subject: "Unusually high electricity bill",
    description: "My electricity bill for this month is 3x higher than usual. I suspect there might be an issue with the meter reading or some anomaly in the system.",
    status: "in_review",
    priority: "high",
    related_report_id: "report_002",
    related_date: "2024-01-15",
    created_at: "2024-01-20T10:30:00Z",
    updated_at: "2024-01-21T14:20:00Z",
  },
  {
    id: "comp_002",
    rrno: "RR1001",
    type: "Meter Issue",
    subject: "Meter reading discrepancy",
    description: "The meter reading doesn't match my actual usage. I've been monitoring my consumption and it's much lower than what's being recorded.",
    status: "resolved",
    priority: "medium",
    related_date: "2024-01-10",
    created_at: "2024-01-15T09:15:00Z",
    updated_at: "2024-01-18T16:45:00Z",
    resolution: "Meter was recalibrated and billing adjusted. Refund of ₹450 processed.",
  },
]

export default function UserComplaintsPage() {
  const { toast } = useToast()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newComplaint, setNewComplaint] = useState({
    type: "",
    subject: "",
    description: "",
    priority: "medium",
    related_date: "",
  })

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setComplaints(mockComplaints)
    setLoading(false)
  }

  const submitComplaint = async () => {
    if (!newComplaint.type || !newComplaint.subject || !newComplaint.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const complaint: Complaint = {
        id: `comp_${Date.now()}`,
        rrno: "RR1001", // Auto-filled
        ...newComplaint,
        status: "submitted",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setComplaints(prev => [complaint, ...prev])
      setIsDialogOpen(false)
      setNewComplaint({
        type: "",
        subject: "",
        description: "",
        priority: "medium",
        related_date: "",
      })

      toast({
        title: "Complaint submitted",
        description: `Your complaint #${complaint.id} has been submitted successfully`,
      })
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Failed to submit complaint. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        )
      case "in_review":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            In Review
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Closed
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case "low":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Complaints</h1>
          <p className="text-muted-foreground">Track and manage your electricity-related complaints</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              File New Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>File a New Complaint</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll investigate it promptly
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rrno">RRNO</Label>
                  <Input id="rrno" value="RR1001" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Complaint Type</Label>
                  <Select value={newComplaint.type} onValueChange={(value) => setNewComplaint(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High Bill">High Bill</SelectItem>
                      <SelectItem value="Meter Issue">Meter Issue</SelectItem>
                      <SelectItem value="Power Quality">Power Quality</SelectItem>
                      <SelectItem value="Billing Error">Billing Error</SelectItem>
                      <SelectItem value="Theft Suspicion">Theft Suspicion</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of the issue"
                  value={newComplaint.subject}
                  onChange={(e) => setNewComplaint(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your complaint..."
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newComplaint.priority} onValueChange={(value) => setNewComplaint(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="related_date">Related Date (Optional)</Label>
                  <Input
                    id="related_date"
                    type="date"
                    value={newComplaint.related_date}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, related_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitComplaint}>
                  Submit Complaint
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaints.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {complaints.filter(c => c.status === "in_review").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complaints.filter(c => c.status === "resolved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {complaints.filter(c => c.priority === "high").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Complaints</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {complaint.subject}
                    </CardTitle>
                    <CardDescription>
                      #{complaint.id} • {complaint.type} • Filed on {new Date(complaint.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(complaint.status)}
                    {getPriorityBadge(complaint.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{complaint.description}</p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Complaint Details</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>RRNO:</span>
                          <span className="font-mono">{complaint.rrno}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span>{complaint.type}</span>
                        </div>
                        {complaint.related_date && (
                          <div className="flex justify-between">
                            <span>Related Date:</span>
                            <span>{complaint.related_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Status Information</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span>{new Date(complaint.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Priority:</span>
                          {getPriorityBadge(complaint.priority)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {complaint.resolution && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <h4 className="font-medium text-sm text-green-800 dark:text-green-200 mb-2">Resolution</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">{complaint.resolution}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {complaints.filter(c => c.status !== "resolved" && c.status !== "closed").map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {complaint.subject}
                    </CardTitle>
                    <CardDescription>
                      #{complaint.id} • {complaint.type}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(complaint.status)}
                    {getPriorityBadge(complaint.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{complaint.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {complaints.filter(c => c.status === "resolved").map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      {complaint.subject}
                    </CardTitle>
                    <CardDescription>
                      #{complaint.id} • Resolved on {new Date(complaint.updated_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {getStatusBadge(complaint.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{complaint.description}</p>
                {complaint.resolution && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h4 className="font-medium text-sm text-green-800 dark:text-green-200 mb-2">Resolution</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">{complaint.resolution}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {complaints.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No complaints found</h3>
            <p className="text-muted-foreground mb-4">You haven't filed any complaints yet.</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              File Your First Complaint
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
