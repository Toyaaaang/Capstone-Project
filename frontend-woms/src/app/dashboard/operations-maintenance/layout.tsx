"use client";

import { usePathname } from "next/navigation";
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

const omdMenu = [
  {
    title: "Dashboard",
    items: [{ title: "Overview", url: "/dashboard/operations-maintenance" }],
  },
  {
    title: "Maintenance Requests",
    items: [
      { title: "Pending Requests", url: "/dashboard/operations-maintenance/pending-requests" },
      { title: "Completed Requests", url: "/dashboard/operations-maintenance/completed-requests" },
    ],
  },
  {
    title: "Equipment & Assets",
    items: [
      { title: "Asset Tracking", url: "/dashboard/operations-maintenance/assets" },
      { title: "Equipment Maintenance", url: "/dashboard/operations-maintenance/equipment" },
    ],
  },
];

export default function OperationsMaintenanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageName, setPageName] = useState("Overview");

  useEffect(() => {
    if (pathname === "/dashboard/operations-maintenance") {
      setPageName("Overview");
    } else {
      setPageName(pathname.split("/").pop()?.replace("-", " ") || "Overview");
    }
  }, [pathname]);

  return (
    <SidebarProvider>
      <AppSidebar menuData={omdMenu} />
      <SidebarInset>
        <div className="flex flex-col flex-1">
          <header className="flex h-16 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/operations-maintenance">
                    Operations & Maintenance
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="capitalize">{pageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="p-4">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
