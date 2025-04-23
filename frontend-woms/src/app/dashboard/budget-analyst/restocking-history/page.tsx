"use client";

import { useState, useEffect } from "react";
import { useReactTable, ColumnDef, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";
import { API_BASE_URL } from "@/lib/constants";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { File, Eye } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface RestockingHistory {
  id: number;
  requested_by: string;
  created_at: string;
  status: string;
  processed_at: string | null;
  items: { id: number; item_name: string; quantity_requested: number }[];
}

export default function RestockingHistoryPage() {
  const [history, setHistory] = useState<RestockingHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<RestockingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RestockingHistory | null>(null);
  const [isRvDialogOpen, setRvDialogOpen] = useState(false); // State for RV dialog visibility
  const [rvPdfUrl, setRvPdfUrl] = useState<string | null>(null); // State for RV PDF URL

  const rowsPerPage = 7; // Set a consistent number of rows per page

  useEffect(() => {
    fetchHistory();
  }, [currentPage]);

  useEffect(() => {
    handleFilters();
  }, [history, searchQuery, statusFilter]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/budget/restocking/history/?page=${currentPage}&page_size=${rowsPerPage}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch restocking history");
      const data = await response.json();
      setHistory(data.results);
      setFilteredHistory(data.results); // Initialize filtered data
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error("Error fetching restocking history:", error);
      toast.error("Failed to fetch restocking history.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRvPdf = async (requestId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/requisition-voucher/view/${requestId}/pdf/`, {
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
  };

  const handleFilters = () => {
    let filtered = history;

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.requested_by.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredHistory(filtered);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const columns: ColumnDef<RestockingHistory>[] = [
    {
      accessorKey: "requested_by",
      header: "Requested By",
      cell: ({ getValue }) => getValue<string>(),
    },
    {
      accessorKey: "created_at",
      header: "Requested At",
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue<string>();
        return (
          <Badge
            className={
              status === "approved"
                ? "bg-black text-white"
                : status === "rejected"
                ? "bg-red-500 text-white"
                : "bg-gray-300 text-black"
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "processed_at",
      header: "Processed At",
      cell: ({ getValue }) =>
        getValue<string>() ? new Date(getValue<string>()).toLocaleString() : "N/A",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          onClick={() => {
            setSelectedRequest(row.original);
            setIsDrawerOpen(true);
          }}
        >
          <Eye className="mr-2" />
          View Details
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredHistory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
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
          <CardTitle className="text-2xl font-bold tracking-tight">Restocking History</CardTitle>
          <div className="flex gap-4 mt-4">
            <Input
              placeholder="Search by user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select onValueChange={(value) => setStatusFilter(value)} defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <p className="text-muted-foreground">No restocking history found.</p>
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
                    <TableRow key={row.id}>
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

      {/* Drawer for Viewing Details */}
      <Drawer open={isDrawerOpen} onOpenChange={(open) => setIsDrawerOpen(open)}>
        <DrawerContent className="max-w-xl mx-auto">
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold tracking-tight ml-2">Request Details</DrawerTitle>
          </DrawerHeader>
          {selectedRequest ? (
            <div className="p-6 space-y-4">
              <p>
                <strong>Requested By:</strong> {selectedRequest.requested_by}
              </p>
              <p>
                <strong>Requested At:</strong>{" "}
                {new Date(selectedRequest.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {selectedRequest.status}
              </p>
              <p>
                <strong>Processed At:</strong>{" "}
                {selectedRequest.processed_at
                  ? new Date(selectedRequest.processed_at).toLocaleString()
                  : "N/A"}
              </p>
              <h3 className="mt-4 font-bold">Items:</h3>
              <ul className="list-disc list-inside">
                {selectedRequest.items.map((item) => (
                  <li key={item.id}>
                    {item.item_name} - {item.quantity_requested}
                  </li>
                ))}
              </ul>

            </div>
          ) : (
            <div className="p-6 text-center">No request selected.</div>
          )}
          <DrawerFooter>
          <Button
            className=" p-5 border-black text-white bg-black hover:bg-gray-800"
            size="sm"
            onClick={() => fetchRvPdf(selectedRequest.id)}
          >
            <File className="mr-2" />
            View RV
          </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
