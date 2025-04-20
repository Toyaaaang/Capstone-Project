"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = "http://127.0.0.1:8000"; // ✅ Define base API URL

export default function RoleApprovalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/warehouse-admin/approve-request/${id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
  
      if (!response.ok) throw new Error("Failed to approve request");
  
      toast.success("Role approved successfully");
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Approval failed");
    }
  };
  
  const handleReject = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/warehouse-admin/reject-request/${id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
  
      if (!response.ok) throw new Error("Failed to reject request");
  
      toast.success("Role rejected successfully");
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Rejection failed");
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
                      <Button size="sm" className="mr-2" onClick={() => handleApprove(request.id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>
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
    </div>
  );
}
