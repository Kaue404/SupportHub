import { renderToString } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import { Sidebar, SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { WorkspaceLayout } from "@/components/workspace-layout"

const requestCookies = vi.hoisted(() => new Map<string, string>())
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get(name: string) {
      const value = requestCookies.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))

beforeEach(() => requestCookies.clear())

function SidebarStateSummary() {
  const { state, openMobile } = useSidebar()
  return (
    <output aria-label="Initial sidebar state">{`${state}:${openMobile}`}</output>
  )
}

it.each([
  ["false", "false", "collapsed:false"],
  ["false", "true", "collapsed:true"],
  ["true", "false", "expanded:false"],
  ["true", "true", "expanded:true"],
  [undefined, undefined, "expanded:false"],
  ["invalid", "invalid", "expanded:false"],
])(
  "renders the request's desktop=%s and mobile=%s preferences before hydration",
  async (desktop, mobile, expected) => {
    if (desktop !== undefined) requestCookies.set("sidebar_state", desktop)
    if (mobile !== undefined) requestCookies.set("sidebar_mobile_state", mobile)
    document.cookie = `sidebar_state=${desktop === "false"}; path=/`
    const layout = await WorkspaceLayout({
      children: (
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <p>Navigation</p>
          </Sidebar>
          <SidebarStateSummary />
        </SidebarProvider>
      ),
    })
    const html = renderToString(layout)
    const state = expected.split(":")[0]
    expect(html).toContain(`data-state="${state}"`)
    expect(html).toContain(`${expected}</output>`)
  }
)
