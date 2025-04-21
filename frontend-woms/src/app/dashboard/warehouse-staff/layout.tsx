"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import NotificationDropdown from "@/components/SidebarNotifications";
import AccountPopover from "@/components/AccountPopover"; // Import the new component
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

const warehouseStaffMenu = [
  {
    title: "Dashboard",
    items: [{ title: "Overview", url: "/dashboard/warehouse-staff" }],
  },
  {
    title: "Material Requests",
    items: [
      { title: "Request Restocking", url: "/dashboard/warehouse-staff/restock-request" },
      { title: "Track Requests", url: "/dashboard/warehouse-staff/track-requests" },
    ],
  },
  {
    title: "Inventory",
    items: [{ title: "Stock Levels", url: "/dashboard/warehouse-staff/stock" }],
  },
  {
    title: "Receiving & Verification",
    items: [
      { title: "Receive Deliveries", url: "/dashboard/warehouse-staff/receive-deliveries" },
      { title: "Verification", url: "/dashboard/warehouse-staff/verification" },
    ],
  },
];

export default function WarehouseStaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageName, setPageName] = useState("Overview");

  useEffect(() => {
    if (pathname === "/dashboard/warehouse-staff") {
      setPageName("Overview");
    } else {
      setPageName(pathname.split("/").pop()?.replace("-", " ") || "Overview");
    }
  }, [pathname]);

  return (
    <SidebarProvider>
      <AppSidebar menuData={warehouseStaffMenu} />
      <SidebarInset>
        <div className="flex flex-col flex-1">
          <header className="flex h-16 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/warehouse-staff">
                    Warehouse Staff
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
