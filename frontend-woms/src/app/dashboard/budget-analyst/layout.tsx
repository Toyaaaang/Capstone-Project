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

const budgetAnalystMenu = [
  {
    title: "Dashboard",
    items: [{ title: "Overview", url: "/dashboard/budget-analyst" }],
  },
  {
    title: "Restocking Requests",
    items: [
      { title: "Pending Requests", url: "/dashboard/budget-analyst/restocking-requests" },
      { title: "Requests History", url: "/dashboard/budget-analyst/restocking-history" },
    ],
  },
  {
    title: "Purchase Orders",
    items: [
      { title: "Create PO", url: "/dashboard/budget-analyst/create-purchase-order" },
      { title: "PO History", url: "/dashboard/budget-analyst/purchase-orders-history" },
    ],
  },
];

export default function BudgetAnalystLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageName, setPageName] = useState("Overview");

  useEffect(() => {
    // If at root, explicitly set "Overview"
    if (pathname === "/dashboard/budget-analyst") {
      setPageName("Overview");
    } else {
      setPageName(pathname.split("/").pop()?.replace("-", " ") || "Overview");
    }
  }, [pathname]);

  return (
    <SidebarProvider>
      <AppSidebar menuData={budgetAnalystMenu} />
      <SidebarInset>
        <div className="flex flex-col flex-1">
          <header className="flex h-16 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/budget-analyst">
                    Budget Analyst
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
          </header>
          <main className="p-4">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
