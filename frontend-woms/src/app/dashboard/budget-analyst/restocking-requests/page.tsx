"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { File } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
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
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { API_BASE_URL } from "@/lib/constants";

interface RestockingRequest {
  created_at: string;
  id: number;
  requested_by: string;
  requested_at: string;
  status: string;
  items: {
    item_name: ReactNode;
    quantity_requested: ReactNode; id: number; name: string; quantity: number 
}[];
}

export default function RestockingRequestsPage() {
  const auth = useAuth();
  const user = auth?.user || null;
  const loading = auth?.loading || false;
  const router = useRouter();

  const [requests, setRequests] = useState<RestockingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RestockingRequest | null>(null);
  const [dialogType, setDialogType] = useState<"approve" | "reject" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRvDialogOpen, setRvDialogOpen] = useState(false); // State for dialog visibility
  const [rvPdfUrl, setRvPdfUrl] = useState<string | null>(null); // State for RV PDF URL

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "budget_analyst") router.push("/dashboard");
      else fetchRequests();
    }
  }, [user, loading]);

  const fetchRequests = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/budget/restocking/pending/?page=${page}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch requests");
      const data = await response.json();
      setRequests(data.results); // Set the paginated results
      setTotalPages(data.total_pages); // Track total pages for pagination
    } catch (error) {
      console.error("Error fetching restocking requests:", error);
      toast.error("Failed to fetch restocking requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/budget/restocking/approve/${selectedRequest.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to approve request");

      toast.success("Restocking request approved");
      setRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Approval failed");
    } finally {
      setDialogType(null);
      setSelectedRequest(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/budget/restocking/reject/${selectedRequest.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to reject request");

      toast.error("Restocking request rejected", {
        description: `Request ID: ${selectedRequest.id} has been rejected.`,
      });

      setRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Rejection failed");
    } finally {
      setDialogType(null);
      setSelectedRequest(null);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchRequests(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      fetchRequests(currentPage - 1);
    }
  };

  const columns: ColumnDef<RestockingRequest>[] = [
    {
      accessorKey: "requested_by",
      header: "Requested By",
      cell: ({ getValue }) =>
        getValue<string>()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
    },
    {
      accessorKey: "created_at",
      header: "Requested At",
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => getValue<string>().charAt(0).toUpperCase() + getValue<string>().slice(1),
    },
    {
      id: "actions",
      header: ({ column }) => (
        <div className="text-right mr-12">Actions</div> // Align header text to the right
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            className="mr-5 p-5"
            size="sm"
            onClick={async (e) => {
              e.stopPropagation(); // Prevent the row's onClick from being triggered
              try {
                const response = await fetch(`${API_BASE_URL}/api/requisition-voucher/view/${row.original.id}/pdf/`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                  },
                });
                if (!response.ok) throw new Error("Failed to fetch RV PDF");
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setRvPdfUrl(url); // Set the PDF URL
                setRvDialogOpen(true); // Open the dialog
              } catch (error) {
                console.error("Error fetching RV PDF:", error);
                toast.error("Failed to fetch the RV PDF.");
              }
            }}
          >
            <File className="mr-2 h-4 w-4" />
            View RV
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: requests,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading || isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Restocking Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">No pending restocking requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => {
                        setSelectedRequest(row.original); // Set the selected request
                        setDrawerOpen(true); // Open the drawer
                      }}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" onClick={handlePreviousPage} disabled={currentPage === 1}>
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button variant="outline" onClick={handleNextPage} disabled={currentPage === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer for Request Details */}
      <Drawer open={drawerOpen} onOpenChange={(open) => setDrawerOpen(open)}>
        <DrawerContent className="max-w-xl mx-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle>Request Details</DrawerTitle>
          </DrawerHeader>

          {selectedRequest ? (
            <div className="p-6 space-y-4">
              <p>
                <strong>Requested By:</strong> {selectedRequest.requested_by
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </p>
              <p>
                <strong>Requested At:</strong> {formatDate(selectedRequest.created_at)}
              </p>
              <p>
                <strong>Status:</strong> {selectedRequest.status
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
              </p>

              <div>
                <strong>Items:</strong>
                <ul className="list-disc pl-6 space-y-2">
                  {selectedRequest.items.map((item) => (
                    <li key={item.id}>
                      {item.item_name} (Quantity: {item.quantity_requested})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">No request selected.</div>
          )}

          <DrawerFooter className="flex justify-between space-x-5">
            <Button onClick={() => setDialogType("approve")} variant="default" className="w-full">
              Approve
            </Button>
            <Button onClick={() => setDialogType("reject")} variant="destructive" className="w-full">
              Reject
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Dialog (used for both approve and reject) */}
      {selectedRequest && (
        <AlertDialog open={!!dialogType} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {dialogType} this restocking request?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={dialogType === "approve" ? handleApprove : handleReject}>
                {dialogType === "approve" ? "Approve" : "Reject"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog for RV PDF */}
      <Dialog open={isRvDialogOpen} onOpenChange={setRvDialogOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-4 flex flex-col">
          <DialogHeader>
            <DialogTitle>Requisition Voucher</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden mt-4">
            {rvPdfUrl ? (
              <iframe
                src={rvPdfUrl}
                title="Requisition Voucher"
                className="w-full h-full border rounded"
              />
            ) : (
              <p className="text-center">No PDF available.</p>
            )}
          </div>
          <DialogFooter>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
