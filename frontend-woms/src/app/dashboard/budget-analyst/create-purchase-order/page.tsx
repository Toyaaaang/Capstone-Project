"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle } from "@/components/ui/drawer";
import { formatDateTime } from "@/utils/format-date";
import { DataTable } from "@/components/budget/Data-Table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DocumentPreviewModal } from "@/components/budget/DocumentPreviewModal";

interface ApprovedRequest {
  id: number;
  requested_by: string;
  created_at: string;
  processed_at: string | null;
  draft_po?: { id: number };
  items: { id: number; item_name: string; quantity_requested: number }[];
}

export default function ApprovedRequestsTable() {
  const [approved, setApproved] = useState<ApprovedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovedRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfUrl, setPdfUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  


  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) fetchApproved(token);
  }, [currentPage]);

  const fetchApproved = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const url = `${API_BASE_URL}/api/budget/approved-requests/`;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });
  
      const res = await fetch(`${url}?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      if (!res.ok) throw new Error("Failed to fetch approved requests");
  
      const data = await res.json();
      console.log("Fetched API Data:", data);
  
      // Log the raw response to inspect the structure
      // console.log("Fetched API Data:", data);
  
      setApproved(data.results);  
      setTotalPages(data.total_pages);  
  
    } catch (err) {
      console.error("Error fetching data:", err);
      setApproved([]);  // Fallback if there's an error
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const columns = useMemo<ColumnDef<ApprovedRequest>[]>(() => [
    {
      accessorKey: "requested_by",
      header: "User",
    },
    {
      accessorKey: "created_at",
      header: "Requested At",
      cell: (info) => formatDateTime(info.getValue()),
    },
    {
      accessorKey: "processed_at",
      header: "Processed At",
      cell: (info) =>
        info.getValue() ? formatDateTime(info.getValue()) : "N/A",
    },
    {
      id: "action",
      header: "Action",
      cell: (info) => (
        <Button variant="outline" onClick={() => handleEditPreview(info.row.original)}>
          Edit / Preview
        </Button>
      ),
    },
  ], []);

  const handleEditPreview = (rowData: ApprovedRequest) => {
    setSelectedRequest(rowData);
    setDrawerOpen(true); // open drawer to show details/editing form
  };
  

  const handleOpenPreviewModal = async (draftPoId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/po_rv/preview/${draftPoId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
  
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setPreviewOpen(true);
      } else {
        throw new Error('Failed to load preview.');
      }
    } catch (error) {
      console.error('Error fetching the document preview:', error);
    }
  };
  
  

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight ml-5 mb-4">Approved Restocking Requests</h2>
      {approved.length === 0 && !isLoading && <p>No records found.</p>}
      <DataTable
        columns={columns}
        data={approved ?? []}
        isLoading={isLoading}
      />

      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
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
            <DrawerTitle>Edit Draft PO/RV</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 space-y-4">
            <p><strong>Requested By:</strong> {selectedRequest?.requested_by}</p>
            <p><strong>Requested At:</strong> {formatDateTime(selectedRequest?.created_at)}</p>
            <div>
              <strong>Items:</strong>
              {selectedRequest?.items && selectedRequest.items.length > 0 ? (
                <ul className="list-disc pl-6 space-y-2">
                  {selectedRequest.items.map((item) => (
                    <li key={item.id}>
                      {item.item_name} (Qty: {item.quantity_requested})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No items found in this request.</p>
              )}
            </div>
            <Button
              variant="outline"
              disabled={!selectedRequest?.draft_po?.id}
              onClick={() => {
                if (selectedRequest?.draft_po?.id) {
                  handleOpenPreviewModal(selectedRequest.draft_po.id);
                } else {
                  console.error('Draft PO ID is missing');
                }
              }}
            >
              Preview PDF
            </Button>

          </div>
          <DrawerFooter />
        </DrawerContent>
      </Drawer>
      <DocumentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentUrl={pdfUrl}
        title="Purchase Order Preview"
        po_id={selectedRequest?.draft_po?.id ?? 0}
      />

    </>
  );
}
