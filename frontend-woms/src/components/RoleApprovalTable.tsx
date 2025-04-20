"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
interface RoleApprovalHistory {
  user: string;
  requested_role: string;
  status: string;
  processed_by: string;
  processed_at: string;
}

const columns: ColumnDef<RoleApprovalHistory>[] = [
    { 
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => row.original.user.username || "N/A", // Extract username
    },
    { accessorKey: "requested_role", header: "Requested Role" },
    { accessorKey: "status", header: "Status" },
    { 
      accessorKey: "processed_by",
      header: "Processed By",
      cell: ({ row }) => row.original.processed_by.username || "N/A", // Extract username
    },
    {
        accessorKey: "processed_at",
        header: "Processed At",
        cell: ({ row }) => new Date(row.original.processed_at).toLocaleString(),
      },  ];
  
  

interface RoleApprovalTableProps {
  data: RoleApprovalHistory[];
  isLoading: boolean;
}

export default function RoleApprovalTable({ data, isLoading }: RoleApprovalTableProps) {
  return <DataTable columns={columns} data={data} isLoading={isLoading} />;
}
