"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function RoleApprovalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "warehouse_admin") {
        router.push("/dashboard");
      } else {
        fetchPendingRequests();
      }
    }
  }, [user, loading]);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/warehouse-admin/pending-requests/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch pending requests");

      const data = await response.json();
      setPendingRequests(data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/warehouse-admin/approve-request/${selectedRequest.id}/`, {
        method: "PATCH",  // Change POST to PATCH
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
  
      if (!response.ok) throw new Error("Failed to approve request");
  
      toast.success("Role approved successfully");
      setPendingRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Approval failed");
    } finally {
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
    }
  };
    

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/warehouse-admin/reject-request/${selectedRequest.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to reject request");

      toast.success("Role rejected successfully");
      setPendingRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Rejection failed");
    } finally {
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
    }
  };

  if (loading || isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );

  return (
  <div className="p-6">
    <Card>
      <CardHeader>
        <CardTitle>Pending Role Approvals</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <p className="text-muted-foreground">No pending requests.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Requested Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.username}</TableCell>
                  <TableCell>{request.role}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setSelectedRequest(request);
                        setDialogType("approve");
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedRequest(request);
                        setDialogType("reject");
                      }}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    {/* Shared Dialog */}
    <AlertDialog open={!!dialogType} onOpenChange={() => setDialogType(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dialogType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {dialogType}{" "}
            <strong>{selectedRequest?.username}</strong>'s request?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDialogType(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              dialogType === "approve" ? handleApprove() : handleReject();
              setDialogType(null);
            }}
          >
            {dialogType === "approve" ? "Approve" : "Reject"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
}
