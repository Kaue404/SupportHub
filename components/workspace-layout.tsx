import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { SidebarDefaultsProvider } from "@/components/ui/sidebar"
import {
  defaultSidebarState,
  parseSidebarCookie,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_MOBILE_COOKIE_NAME,
} from "@/lib/sidebar-state"

export async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const stored = await cookies()
  const value = {
    open:
      parseSidebarCookie(stored.get(SIDEBAR_COOKIE_NAME)?.value) ??
      defaultSidebarState.open,
    openMobile:
      parseSidebarCookie(stored.get(SIDEBAR_MOBILE_COOKIE_NAME)?.value) ??
      defaultSidebarState.openMobile,
  }

  return (
    <SidebarDefaultsProvider value={value}>{children}</SidebarDefaultsProvider>
  )
}
