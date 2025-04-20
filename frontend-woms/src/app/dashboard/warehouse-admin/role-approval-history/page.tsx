"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import RoleApprovalTable from "@/components/RoleApprovalTable";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoleApprovalHistory {
  user: string;
  requested_role: string;
  status: string;
  processed_by: string;
  processed_at: string;
}

export default function RoleApprovalHistoryPage() {
  const router = useRouter();
  const [data, setData] = useState<RoleApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: "",
    user: "",
  });
  
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Default page size
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        setAccessToken(storedToken);
      }
    }
  }, []);

  const fetchHistory = async (applyFilters = false) => {
    setLoading(true);
    const token = accessToken;

    try {
      let params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      if (applyFilters) {
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.status) params.status = filters.status;
        if (filters.user) params.user = filters.user.toLowerCase();
      }

      const res = await axios.get("http://127.0.0.1:8000/api/warehouse-admin/role-requests/history/", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(res.data.results);
      setTotalPages(res.data.total_pages || 1); 
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      toast.error("Failed to fetch role approval history.");
    } finally {
      setLoading(false);
    }
  };


  // Fetch data when token or pagination changes
  useEffect(() => {
    if (accessToken) {
      fetchHistory(isFiltered);
    }
  }, [accessToken, currentPage]);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Role Approval History</h2>

      <div className="flex flex-wrap gap-4">

        <Select
          value={filters.status}
          onValueChange={(value) => {
            setFilters((prev) => ({ ...prev, status: value }));
            setIsFiltered(true);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="text"
          placeholder="Search by User"
          className="w-[200px]"
          value={filters.user}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, user: e.target.value }));
            setIsFiltered(true);
          }}
        />

        <Button onClick={() => { setCurrentPage(1); fetchHistory(true); }} disabled={!isFiltered || loading}>
          Apply Filters
        </Button>

        <Button
          onClick={() => {
            setFilters({ startDate: null, endDate: null, status: "", user: "" });
            setIsFiltered(false);
            setCurrentPage(1);
            fetchHistory(false);
          }}
          disabled={!isFiltered}
          variant="secondary"
        >
          Reset Filters
        </Button>
      </div>

      {/* Data Table with Pagination */}
      <RoleApprovalTable
        data={data}
        isLoading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
