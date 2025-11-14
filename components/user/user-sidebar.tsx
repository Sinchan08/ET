"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { BarChart3, FileText, Zap, User, Settings, Home } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SheetTitle } from "@/components/ui/sheet";
import Image from "next/image"

// 1. IMPORT THE useAuth HOOK
import { useAuth } from "@/components/auth/auth-provider";

const userMenuItems = [
  {
    title: "Dashboard",
    url: "/user",
    icon: Home,
  },
  {
    title: "Check Usage",
    url: "/user/check-usage",
    icon: Zap,
  },
  {
    title: "My Reports",
    url: "/user/reports",
    icon: BarChart3,
  },
  {
    title: "My Complaints",
    url: "/user/complaints",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/user/settings",
    icon: Settings,
  },
]

export function UserSidebar() {
  const pathname = usePathname()

  // 2. GET THE LOGGED-IN USER
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader>
        {/* 3. FIX FOR THE CRASH: SheetTitle goes HERE */}
        <div className="flex items-center gap-2 px-4 py-2">
          <Zap className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold">Theft Detection</h2>
            <p className="text-sm text-muted-foreground">User Portal</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User />
              {/* 4. FIX FOR "Demo User": Display the real name */}
              <span>{user ? user.name : 'User'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}