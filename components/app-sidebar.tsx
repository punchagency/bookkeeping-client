"use client";
import Link from "next/link";
import { Gauge, ScrollText, Landmark, LogOut, Users } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const sidbarTopItems = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Gauge,
  },

  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Statements",
    url: "/statements",
    icon: ScrollText,
  },

  {
    title: "Connect Bank",
    url: "/connect-bank",
    icon: Landmark,
  },
];

const sidebarFooterItems = [
  {
    title: "Logout",
    url: "/auth/logout",
    icon: LogOut,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isActive = (url: string) => pathname === url;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-md font-bold">
            Mx Project Demo
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidbarTopItems.map((item) => (
                <SidebarMenuItem key={item.title} className="cursor-pointer">
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroupContent>
          <SidebarMenu>
            {sidebarFooterItems.map((item) => (
              <SidebarMenuItem key={item.title} className="cursor-pointer">
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarFooter>
    </Sidebar>
  );
}
