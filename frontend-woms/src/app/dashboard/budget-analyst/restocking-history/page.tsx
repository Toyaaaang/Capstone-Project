"use client"
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle } from "@/components/ui/drawer";
import { formatDateTime } from "@/utils/format-date";
import { DataTable } from "@/components/budget/Data-Table"; 
import { Input } from "@/components/ui/input"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RestockingHistory | null>(null);
  const [filters, setFilters] = useState({ startDate: null, endDate: null, status: "", user: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8); // Default page size
  const [totalPages, setTotalPages] = useState(1);

  const handleStatusChange = (value: string) => {
    // If "all" is selected, reset the status filter
    if (value === "all") {
      setFilters({ ...filters, status: "" });
    } else {
      setFilters({ ...filters, status: value });
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("access_token"); // get the token
    if (token) {
      fetchHistory(token);
    }
  }, [currentPage, filters]);

  const fetchHistory = async (accessToken: string) => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/api/budget/restocking/history/`;
      let params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);

      params.append("page", currentPage.toString());
      params.append("page_size", pageSize.toString());

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistory(data.results);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const columns = [
    {
      header: "User",
      accessorKey: "requested_by",
    },
    {
      header: "Requested At",
      accessorKey: "created_at",
      cell: (info: any) => formatDateTime(info.getValue()),
    },
    {
      header: "Status",
      accessorKey: "status",
    },
    {
      header: "Processed At",
      accessorKey: "processed_at",
      cell: (info: any) => info.getValue() ? formatDateTime(info.getValue()) : "N/A",
    },
    {
      header: "Actions",
      cell: (info: any) => (
        <Button variant="outline" onClick={() => handleViewDetails(info.row.original)}>
          View Details
        </Button>
      ),
    },
  ];

  const handleViewDetails = (data: RestockingHistory) => {
    setSelectedRequest(data);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <>
    
    <div className="flex flex-wrap gap-4 items-end mb-4">
      <h2 className="text-2xl font-semibold tracking-tight mr-12 ml-5">Requests History</h2>

      {/* User Filter */}
      <div className="flex flex-col space-y-1">
        <Input
          id="user-filter"
          className="w-[200px]"
          placeholder="Search by user"
          value={filters.user}
          onChange={(e) => setFilters({ ...filters, user: e.target.value })}
        />
      </div>

      {/* Status Filter */}
      <div className="flex flex-col space-y-1">
        <Select
          id="status-filter"
          value={filters.status}
          onValueChange={(value) => {
            // Reset status filter if "all" is selected
            if (value === "all") {
              setFilters({ ...filters, status: "" }); // Clear the status filter
            } else {
              setFilters({ ...filters, status: value }); // Set the selected status
            }
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    
</div>
      <DataTable
        columns={columns}
        data={history}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </Button>

        <div className="flex items-center">
          <span>Page {currentPage} of {totalPages}</span>
        </div>

        <Button
          variant="outline"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-w-xl mx-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle>Request Details</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 space-y-4">
            <p><strong>Requested By:</strong> {selectedRequest?.requested_by}</p>
            <p><strong>Requested At:</strong> {formatDateTime(selectedRequest?.created_at)}</p>
            <p><strong>Status:</strong> {selectedRequest?.status}</p>
            <div>
              <strong>Items:</strong>
              <ul className="list-disc pl-6 space-y-2">
                {selectedRequest?.items.map((item) => (
                  <li key={item.id}>
                    {item.item_name} (Quantity: {item.quantity_requested})
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DrawerFooter className="flex w-full justify-between space-x-4 mb-4" />
        </DrawerContent>
      </Drawer>
    </>
  );
}
