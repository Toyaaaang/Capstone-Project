"use client";

import { usePathname } from "next/navigation";
import NotificationDropdown from "@/components/SidebarNotifications";
import AccountPopover from "@/components/AccountPopover";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

const warehouseAdminMenu = [
  {
    title: "Dashboard",
    items: [{ title: "Overview", url: "/dashboard/warehouse-admin" }],
  },
  {
    title: "Role Management",
    items: [
      { title: "Role Requests", url: "/dashboard/warehouse-admin/role-requests" },
      { title: "Approval History", url: "/dashboard/warehouse-admin/role-approval-history" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { title: "Stock Management", url: "/dashboard/warehouse-admin/stock" },
      { title: "Purchase Orders", url: "/dashboard/warehouse-admin/purchase-orders" },
    ],
  },
];

export default function WarehouseAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageName, setPageName] = useState("Overview");

  useEffect(() => {
    // If at root, explicitly set "Overview"
    if (pathname === "/dashboard/warehouse-admin") {
      setPageName("Overview");
    } else {
      setPageName(pathname.split("/").pop()?.replace("-", " ") || "Overview");
    }
  }, [pathname]);

  return (
    <SidebarProvider>
      <AppSidebar menuData={warehouseAdminMenu} />
      <SidebarInset>
        <div className="flex flex-col flex-1">
          <header className="flex h-16 items-center gap-2 border-b px-4 justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/warehouse-admin">
                    Warehouse Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="capitalize">
                    {pageName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
            {/* NotificationDropdown moved to the left of AccountPopover */}
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <AccountPopover />
            </div>
          </header>
          <main className="p-4">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
