// components/admin/admin-sidebar.tsx

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
import { BarChart3, Upload, Brain, FileText, Settings, Zap, Map, RefreshCw, User, Shield } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"

const adminMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: BarChart3 },
  { title: "Data Upload", url: "/admin/data-upload", icon: Upload },
  { title: "Predictions", url: "/admin/predictions", icon: Brain },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Anomaly Reports", url: "/admin/anomalies", icon: FileText },
  { title: "Model Training", url: "/admin/training", icon: RefreshCw },
  { title: "Rule Engine", url: "/admin/rules", icon: Settings },
  { title: "Geo View", url: "/admin/geo", icon: Map },
  { title: "Settings", url: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Zap className="h-8 w-8 text-red-600" />
          <div>
            <h2 className="text-lg font-semibold">Theft Detection</h2>
            <p className="text-sm text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
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
              <Shield />
              <span>Admin User</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}