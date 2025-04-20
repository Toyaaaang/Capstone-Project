// columns.ts
import { ColumnDef } from "@tanstack/react-table";

type RestockingRequest = {
  id: number;
  item_name: string;
  quantity_requested: number;
  status: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
};

export const columns: ColumnDef<RestockingRequest>[] = [
  {
    accessorKey: "item_name",
    header: "Item Name",
    cell: ({ row }) => <div>{row.getValue("item_name")}</div>,
  },
  {
    accessorKey: "quantity_requested",
    header: "Quantity",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`${
          row.getValue("status") === "approved"
            ? "text-green-600"
            : "text-red-600"
        } font-medium`}
      >
        {row.getValue("status")}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Requested At",
    cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleString(),
  },
  {
    accessorKey: "approved_at",
    header: "Approved At",
    cell: ({ row }) =>
      row.getValue("approved_at")
        ? new Date(row.getValue("approved_at")).toLocaleString()
        : "-",
  },
  {
    accessorKey: "rejected_at",
    header: "Rejected At",
    cell: ({ row }) =>
      row.getValue("rejected_at")
        ? new Date(row.getValue("rejected_at")).toLocaleString()
        : "-",
  },
];
