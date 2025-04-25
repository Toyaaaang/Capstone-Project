"use client";

import { useState, useEffect } from "react";
import { useReactTable, ColumnDef, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { formatDateTime } from "@/utils/format-date";
import { File } from "lucide-react";

interface RestockingRequest {
  id: number;
  requested_by: string;
  approved_at: string;
  requisition_voucher: {
    rv_number: string;
    pdf_file: string;
    created_at: string;
  } | null;
  items: {
    unit: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price?: number;
  }[];
}

export default function CreatePurchaseOrderPage() {
  const [requests, setRequests] = useState<RestockingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPoDialogOpen, setPoDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RestockingRequest | null>(null);
  const [supplier, setSupplier] = useState("");
  const [shippingInstructions, setShippingInstructions] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRvDialogOpen, setRvDialogOpen] = useState(false);
  const [rvPdfUrl, setRvPdfUrl] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/budget/restocking/approved-with-rv/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch approved requests");
      const data = await response.json();
      setRequests(data.results || []);
    } catch (error) {
      console.error("Error fetching approved requests:", error);
      toast.error("Failed to fetch approved requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handlePreview = async () => {
    if (!selectedRequest) return;

    try {
      const items = selectedRequest.items.map((item) => ({
        ...item,
        total_price: item.quantity * item.unit_price,
      }));
      const grand_total = items.reduce((sum, item) => sum + item.total_price!, 0);

      const poData = {
        po_number: `PO-${Date.now()}`,
        supplier,
        shipping_instructions: shippingInstructions,
        rv_number: selectedRequest.requisition_voucher?.rv_number || "N/A",
        address,
        items,
        grand_total,
      };

      const response = await fetch(`${API_BASE_URL}/api/po_rv/preview/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(poData),
      });

      if (!response.ok) throw new Error("Failed to fetch PO preview");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error fetching PO preview:", error);
      toast.error("Failed to fetch PO preview.");
    }
  };

  const handleCreate = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);

    try {
      const items = selectedRequest.items.map((item) => ({
        ...item,
        total_price: item.quantity * item.unit_price,
      }));
      const grand_total = items.reduce((sum, item) => sum + item.total_price!, 0);

      const poData = {
        po_number: `PO-${Date.now()}`,
        supplier,
        shipping_instructions: shippingInstructions,
        rv_number: selectedRequest.requisition_voucher?.rv_number || "N/A",
        address,
        items,
        grand_total,
      };

      const response = await fetch(`${API_BASE_URL}/api/po_rv/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(poData),
      });

      if (!response.ok) throw new Error("Failed to create Purchase Order");

      toast.success("Purchase Order created successfully!");
      setPoDialogOpen(false);
    } catch (error) {
      console.error("Error creating Purchase Order:", error);
      toast.error("Failed to create Purchase Order.");
    } finally {
      setIsSubmitting(false);
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
      accessorKey: "approved_at",
      header: "Approved At",
      cell: ({ getValue }) => {
        const value = getValue() as string | null;
        return value ? formatDateTime(value) : "N/A";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end space-x-2">
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
            className="bg-blue-500 text-white hover:bg-blue-600"
            size="sm"
            onClick={() => {
              console.log("Opening PO Dialog");
              setSelectedRequest(row.original);
              setPoDialogOpen(true);
            }}
          >
            Create PO
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: requests || [],
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

  if (requests.length === 0) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">No approved restocking requests found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Purchase Order</h1>
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
      </div>

      {/* Dialog for PO Creation */}
      <Dialog open={isPoDialogOpen} onOpenChange={setPoDialogOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-4 flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4">
            <Form>
              <FormField>
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder="Enter supplier name"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField>
                <FormItem>
                  <FormLabel>Shipping Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      value={shippingInstructions}
                      onChange={(e) => setShippingInstructions(e.target.value)}
                      placeholder="Enter shipping instructions"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField>
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter delivery address"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </Form>
          </div>

          <DialogFooter>
            <Button onClick={handlePreview} className="bg-gray-500 text-white hover:bg-gray-600">
              Preview
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-blue-500 text-white hover:bg-blue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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