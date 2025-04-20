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

const employeeMenu = [
  {
    title: "Dashboard",
    items: [{ title: "Overview", url: "/dashboard/employee" }],
  },
  {
    title: "Material Requests",
    items: [
      { title: "Request Materials", url: "/dashboard/employee/request-materials" },
      { title: "My Requests", url: "/dashboard/employee/my-requests" },
    ],
  },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageName, setPageName] = useState("Overview");

  useEffect(() => {
    if (pathname === "/dashboard/employee") {
      setPageName("Overview");
    } else {
      setPageName(pathname.split("/").pop()?.replace("-", " ") || "Overview");
    }
  }, [pathname]);

  return (
    <SidebarProvider>
      <AppSidebar menuData={employeeMenu} />
      <SidebarInset>
        <div className="flex flex-col flex-1">
          <header className="flex h-16 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/employee">Employee</BreadcrumbLink>
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
