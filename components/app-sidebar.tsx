"use client";
import Link from "next/link";
import {
  Gauge,
  ScrollText,
  BadgeDollarSign,
  LogOut,
  Users,
  Settings,
  MessageCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    title: "Transactions",
    url: "/transactions",
    icon: BadgeDollarSign,
  },

  {
    title: "Conversations",
    url: "/conversations",
    icon: MessageCircle,
  },
];

const sidebarFooterItems = [
  {
    title: "Logout",
    url: "/auth/logout",
    icon: LogOut,
  },

  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const isActive = (url: string) => pathname === url;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-md font-bold">
            Bookkeeping Demo
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
      <SidebarFooter className="border-t">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full outline-none">
            <div className="flex items-center gap-2 w-full  py-2 hover:bg-accent/50 transition-colors">
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  width={32}
                  height={32}
                  className="rounded-full flex-shrink-0"
                />
              )}
              <div className="flex flex-col min-w-0 text-left">
                <span className="font-medium truncate">{user?.fullName}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60"
            align="start"
            side="top"
            sideOffset={8}
          >
            {sidebarFooterItems.map((item) => (
              <DropdownMenuItem key={item.title}>
                <Link
                  href={item.url}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
