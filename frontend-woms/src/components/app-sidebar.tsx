"use client";

import React, { useContext } from "react";
import { LogOut } from 'lucide-react';
import { usePathname, useRouter } from "next/navigation";
import AuthContext from "@/context/AuthContext";
import Image from "next/image";
import { SearchForm } from "@/components/search-form";
import NotificationDropdown from "@/components/SidebarNotifications";
import { VersionSwitcher } from "@/components/version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface SidebarItem {
  title: string;
  url: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  menuData: SidebarSection[];
  versions?: string[];
}

export function AppSidebar({ menuData, versions = [], ...props }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname(); // Get current page
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    setTimeout(() => {
      logout();
    }, 1000);
  };

  return (
    <Sidebar {...props}>
    <SidebarHeader>
      {versions.length > 0 && (
        <VersionSwitcher versions={versions} defaultVersion={versions[0]} />
      )}

  {/* Top Section: Logo + Title + Notifications */}
     <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-x-3 my-3">
        <Image src="/app-logo.png" alt="Logo" width={40} height={40} className="h-10 w-10" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm text-gray-600">Warehouse Operations</span>
          <span className="text-sm text-gray-600">Management System</span>
        </div>
      </div>

        <NotificationDropdown />
      </div>

      {/* Bottom Section: Full-Width Search */}
      <div className="w-full">
        <SearchForm />
      </div>
    </SidebarHeader>

      <SidebarContent>
        {menuData.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.url; // Check if active
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        onClick={() => router.push(item.url)}
                      >
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <Button className="w-full bg-red-500 hover:bg-red-600 text-white" onClick={handleLogout}>
          Log out
          <LogOut className="mr-2 h-4 w-4" />
        </Button>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
