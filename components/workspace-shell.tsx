"use client"

import type { ComponentProps, CSSProperties, ReactNode } from "react"
import Link from "next/link"
import { Headset, LayoutDashboard } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { ProfileMenu } from "@/components/profile-menu"
import { ThemeToggle } from "@/components/theme-toggle"

function SidebarLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented && isMobile) setOpenMobile(false)
      }}
    />
  )
}

export function WorkspaceShell({
  page,
  children,
}: {
  page: "Overview" | "Profile"
  children: ReactNode
}) {
  return (
    <SidebarProvider
      className="hub-shell"
      style={
        {
          "--sidebar-width": "244px",
          "--sidebar-width-icon": "64px",
        } as CSSProperties
      }
    >
      <Sidebar
        collapsible="icon"
        role="complementary"
        aria-label="Workspace sidebar"
        className="hub-sidebar"
      >
        <SidebarHeader className="hub-sidebar-header">
          <SidebarLink
            href="/home"
            className="brand"
            aria-label="Support Hub — home"
          >
            <span className="brand-icon">
              <Headset size={24} strokeWidth={1.8} />
            </span>
            <span>
              Support <span className="brand-light">Hub</span>
            </span>
          </SidebarLink>
          <SidebarTrigger
            className="sidebar-collapse-toggle"
            aria-label="Toggle sidebar"
          />
        </SidebarHeader>
        <SidebarSeparator className="sidebar-header-divider" />
        <SidebarContent className="hub-sidebar-content">
          <SidebarGroupLabel className="workspace-label">
            WORKSPACE
          </SidebarGroupLabel>
          <nav aria-label="Main navigation">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={page === "Overview"}>
                  <SidebarLink
                    href="/home"
                    className="sidebar-overview"
                    aria-label="Overview"
                    aria-current={page === "Overview" ? "page" : undefined}
                  >
                    <LayoutDashboard size={18} />
                    <span className="sidebar-link-label">Overview</span>
                  </SidebarLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </nav>
        </SidebarContent>
        <SidebarFooter className="workspace-profile">
          <ProfileMenu />
          <ThemeToggle />
        </SidebarFooter>
      </Sidebar>
      <div className="hub-main">
        <header className="hub-topbar">
          <div className="hub-header-navigation">
            <SidebarTrigger
              className="sidebar-mobile-open"
              aria-label="Open sidebar"
            />
            <Breadcrumb aria-label="Page navigation">
              <BreadcrumbList>
                {page === "Overview" && (
                  <>
                    <BreadcrumbItem>Workspace</BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>{page}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {children}
      </div>
    </SidebarProvider>
  )
}
