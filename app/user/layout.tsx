"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { UserSidebar } from "@/components/user/user-sidebar"
import { UserHeader } from "@/components/user/user-header"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <UserSidebar />
        <div className="flex-1">
          <UserHeader />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
