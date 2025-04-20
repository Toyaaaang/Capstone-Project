"use client";

import { useState, useEffect } from "react";
import { useTable, usePagination } from "@tanstack/react-table"; // TanStack Table hooks
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"; // Drawer components
import { Badge } from "@/components/ui/badge"; // Badge component
import { Button } from "@/components/ui/button"; // Button component
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton Loader
import { formatDateTime } from "@/utils/format-date"; // DateFormatter utility

interface RestockingHistory {
  id: number;
  requested_by: string;
  created_at: string;
  status: string;
  processed_at: string | null;
  items: { id: number; item_name: string; quantity_requested: number }[]; // Items to show in the drawer
}

interface RestockingHistoryTableProps {
  history: RestockingHistory[];
  isLoading: boolean;
}

export function RestockingHistoryTable({ history, isLoading }: RestockingHistoryTableProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<RestockingHistory | null>(null);

  // Columns for TanStack Table
  const columns = [
    {
      header: "Requested By",
      accessorKey: "requested_by",
    },
    {
      header: "Created At",
      accessorKey: "created_at",
      cell: (info: any) => formatDateTime(info.getValue()), // Using DateFormatter utility
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info: any) => (
        <Badge variant={info.getValue() === "approved" ? "success" : "destructive"}>{info.getValue()}</Badge>
      ),
    },
    {
      header: "Decision Timestamp",
      accessorKey: "processed_at",
      cell: (info: any) => (info.getValue() ? formatDateTime(info.getValue()) : "N/A"),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (info: any) => (
        <Button variant="outline" onClick={() => handleRowClick(history.find((item) => item.id === info.getValue())!)} >
          View Details
        </Button>
      ),
    },
  ];

  // Using TanStack Table to manage pagination
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    pageCount,
    canPreviousPage,
    canNextPage,
    pageIndex,
    pageSize,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex: currentPage, pageSize: currentPageSize },
  } = useTable(
    {
      columns,
      data: history,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
      },
      manualPagination: true,
      pageCount: Math.ceil(history.length / 10), // Calculate total pages
    },
    usePagination
  );

  const handleRowClick = (historyItem: RestockingHistory) => {
    setSelectedHistory(historyItem);
    setDrawerOpen(true);
  };

  // Drawer for Restocking Request Details
  return (
    <div className="p-6">
      {isLoading ? (
        // Skeleton Loader for loading state
        <div className="p-6">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <div>
          <table {...getTableProps()} className="min-w-full">
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th {...column.getHeaderProps()}>{column.render("Header")}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map((row) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell) => (
                      <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => previousPage()} disabled={!canPreviousPage}>
              Previous
            </Button>
            <span>
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button variant="outline" onClick={() => nextPage()} disabled={!canNextPage}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Drawer for Restocking Request Details */}
      {selectedHistory && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Request Details</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <p><strong>Requested By:</strong> {selectedHistory.requested_by}</p>
              <p><strong>Requested At:</strong> {formatDateTime(selectedHistory.created_at)}</p>
              <p><strong>Status:</strong> {selectedHistory.status}</p>
              <p><strong>Decision Timestamp:</strong> {selectedHistory.processed_at ? formatDateTime(selectedHistory.processed_at) : "N/A"}</p>
              <h4 className="mt-4">Requested Items:</h4>
              <ul>
                {selectedHistory.items.map((item) => (
                  <li key={item.id}>
                    {item.item_name} (Quantity: {item.quantity_requested})
                  </li>
                ))}
              </ul>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
