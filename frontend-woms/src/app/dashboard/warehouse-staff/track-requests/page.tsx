"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { formatDateTime } from "@/utils/format-date";
import { Files, List  } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";

interface RestockRequest {
  id: number;
  items: { id: number; item_name: string; quantity_requested: number; unit: string }[];
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function TrackRestockRequests() {
  const [data, setData] = useState<RestockRequest[]>([]);
  const [filteredData, setFilteredData] = useState<RestockRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfOpen, setPdfOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchRequests() {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/warehouse/restock-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        result.sort((a: RestockRequest, b: RestockRequest) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setData(result);
        setFilteredData(result);
      }
    }
    fetchRequests();
  }, []);

  useEffect(() => {
    let filtered = [...data];
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }
    if (dateFilter) {
      filtered = filtered.filter((req) => req.created_at.startsWith(dateFilter));
    }
    if (searchQuery) {
      filtered = filtered.filter((req) =>
        req.items.some((item) =>
          item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    setFilteredData(filtered);
  }, [statusFilter, dateFilter, searchQuery, data]);

  const handleViewRV = async (requestId: number) => {
    const token = localStorage.getItem("access_token");
    setIsLoading(true); // Start loading
    try {
      const response = await fetch(`${API_BASE_URL}/api/requisition-voucher/view/${requestId}/pdf/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url); // Set the Blob URL
        setPdfOpen(true); // Open the modal
      } else if (response.status === 404) {
        toast.error("No Requisition Voucher found for this request.");
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to fetch the RV PDF.");
      }
    } catch (error) {
      console.error("Error fetching RV PDF:", error);
      toast.error("An unexpected error occurred while fetching the RV PDF.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const columns: ColumnDef<RestockRequest>[] = [
    {
      id: "summary",
      header: "Summary",
      cell: ({ row }) => `${row.original.items.length} item(s)`,
    },
    {
      id: "item_names",
      header: "Item Name",
      cell: ({ row }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <List className="mr-2 h-4 w-4" />
              View Items
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <ul className="space-y-2">
              {row.original.items.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.item_name}</span> - {item.quantity_requested} {item.unit}
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue<string>() as keyof typeof statusColors;
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        };
        return (
          <Badge variant="outline" className={statusColors[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Requested Date",
      cell: ({ getValue }) => formatDateTime(getValue<string>()),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          onClick={() => handleViewRV(row.original.id)} // Pass the RestockRequest ID
        >
          View RV
          <Files className="mr-2 h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Track Restock Requests</h2>

      {/* Filters */}
      <div className="flex gap-4">
        <Select onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        <Input
          type="text"
          placeholder="Search by item name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          variant="outline"
          onClick={() => {
            setStatusFilter("");
            setDateFilter("");
            setSearchQuery("");
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
        />
      )}

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfOpen} onOpenChange={(isOpen) => {
        setPdfOpen(isOpen);
        if (!isOpen) {
          setPdfUrl(null); // Reset the PDF URL when the modal closes
        }
      }}>
        <DialogContent className="max-w-6xl h-[90vh] p-4 flex flex-col">
          <DialogHeader>
            <DialogTitle>Requisition Voucher</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden mt-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[80vh] w-full" />
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Requisition Voucher"
                className="w-full h-full border rounded"
              />
            ) : (
              <p className="text-center">No PDF available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}