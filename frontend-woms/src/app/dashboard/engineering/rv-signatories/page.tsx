"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { File, PenLine } from "lucide-react";
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
    quantity_requested: ReactNode;
    id: number;
    name: string;
    quantity: number;
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
      else if (user.role !== "engineering") router.push("/dashboard");
      else fetchRequests();
    }
  }, [user, loading]);

  const fetchRequests = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/engineering/restocking/requests/?page=${page}`, {
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

  const handleSign = async (requestId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/engineering/restocking/sign/${requestId}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to sign the RV");
      toast.success("Requisition Voucher signed successfully!");
    } catch (error) {
      console.error("Error signing RV:", error);
      toast.error("Failed to sign the RV.");
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
        <div className="text-right mr-22">Actions</div> // Align header text to the right
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
          <Button
            className="p-5 bg-blue-500 text-white hover:bg-blue-600"
            size="sm"
            onClick={() => handleSign(row.original.id)}
          >
            <PenLine className="mr-2 h-4 w-4" />
            Sign RV
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
          <CardTitle className="text-2xl font-bold tracking-tight mr-12 ml-5">Restocking Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">No restocking requests found.</p>
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
          <DialogFooter></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
