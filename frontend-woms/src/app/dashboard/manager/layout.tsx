"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationDropdown from "@/components/SidebarNotifications";
import AccountPopover from "@/components/AccountPopover"; 
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

const managerMenu = [
  {
    title: "Dashboard",
    items: [{ title: "Overview", url: "/dashboard/manager" }],
  },
  {
    title: "Reports & Analytics",
    items: [
      { title: "Stock Reports", url: "/dashboard/manager/stock-reports" },
      { title: "Procurement Insights", url: "/dashboard/manager/procurement-insights" },
    ],
  },
  {
    title: "Approvals",
    items: [
      { title: "Pending Approvals", url: "/dashboard/manager/pending-approvals" },
      { title: "Approval History", url: "/dashboard/manager/approval-history" },
    ],
  },
  {
    title: "Document Signatories",
    items: [
      { title: "RV Signatories", url: "/dashboard/manager/rv-signatories" },
      { title: "Approval History", url: "/dashboard/manager/approval-history" },
    ],
  },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageName, setPageName] = useState("Overview");

  useEffect(() => {
    if (pathname === "/dashboard/manager") {
      setPageName("Overview");
    } else {
      setPageName(pathname.split("/").pop()?.replace("-", " ") || "Overview");
    }
  }, [pathname]);

  return (
    <SidebarProvider>
      <AppSidebar menuData={managerMenu} />
      <SidebarInset>
        <div className="flex flex-col flex-1">
          <header className="flex h-16 items-center gap-2 border-b px-4 justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/manager">Manager</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="capitalize">{pageName}</BreadcrumbPage>
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
