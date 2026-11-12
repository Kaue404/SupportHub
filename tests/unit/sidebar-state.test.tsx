import type { ComponentProps } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, expect, it, vi } from "vitest"
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const viewport = vi.hoisted(() => ({ mobile: false }))
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => viewport.mobile }))

beforeEach(() => {
  viewport.mobile = false
})

function SidebarHarness(props: ComponentProps<typeof SidebarProvider>) {
  return (
    <SidebarProvider {...props}>
      <Sidebar
        collapsible="icon"
        role="complementary"
        aria-label="Test sidebar"
      >
        <SidebarTrigger aria-label="Close sidebar" />
        <p>Sidebar content</p>
      </Sidebar>
      <SidebarTrigger aria-label="Toggle sidebar" />
    </SidebarProvider>
  )
}

function desktopSidebar() {
  return screen.getByRole("complementary", { name: "Test sidebar" })
    .parentElement
}

it("starts expanded when no sidebar preference has been saved", () => {
  render(<SidebarHarness />)
  expect(desktopSidebar()).toHaveAttribute("data-state", "expanded")
})

it.each([
  ["false", "collapsed"],
  ["true", "expanded"],
])("restores the saved desktop preference %s as %s", (saved, state) => {
  document.cookie = `sidebar_state=${saved}; path=/`
  render(<SidebarHarness />)
  expect(desktopSidebar()).toHaveAttribute("data-state", state)
})

it("saves both collapsed and expanded desktop states and restores them on remount", async () => {
  const user = userEvent.setup()
  let view = render(<SidebarHarness />)
  await user.click(screen.getByRole("button", { name: "Toggle sidebar" }))
  expect(desktopSidebar()).toHaveAttribute("data-state", "collapsed")
  expect(document.cookie).toContain("sidebar_state=false")
  view.unmount()
  view = render(<SidebarHarness />)
  expect(desktopSidebar()).toHaveAttribute("data-state", "collapsed")
  await user.click(screen.getByRole("button", { name: "Toggle sidebar" }))
  expect(document.cookie).toContain("sidebar_state=true")
  view.unmount()
  render(<SidebarHarness />)
  expect(desktopSidebar()).toHaveAttribute("data-state", "expanded")
})

it("persists changes made through the keyboard shortcut", async () => {
  const user = userEvent.setup()
  const view = render(<SidebarHarness />)
  await user.keyboard("{Control>}b{/Control}")
  expect(document.cookie).toContain("sidebar_state=false")
  view.unmount()
  render(<SidebarHarness />)
  expect(desktopSidebar()).toHaveAttribute("data-state", "collapsed")
})

it("uses defaultOpen when the saved preference is invalid", () => {
  document.cookie = "sidebar_state=invalid; path=/"
  render(<SidebarHarness defaultOpen={false} />)
  expect(desktopSidebar()).toHaveAttribute("data-state", "collapsed")
})

it("keeps the controlled open prop authoritative over the saved preference", async () => {
  document.cookie = "sidebar_state=false; path=/"
  const onOpenChange = vi.fn()
  const user = userEvent.setup()
  const view = render(<SidebarHarness open onOpenChange={onOpenChange} />)
  expect(desktopSidebar()).toHaveAttribute("data-state", "expanded")
  await user.click(screen.getByRole("button", { name: "Toggle sidebar" }))
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  expect(desktopSidebar()).toHaveAttribute("data-state", "expanded")
  view.rerender(<SidebarHarness open={false} onOpenChange={onOpenChange} />)
  expect(desktopSidebar()).toHaveAttribute("data-state", "collapsed")
})

it("still toggles when saving cookies is blocked", async () => {
  document.cookie = "sidebar_state=true; path=/"
  const setter = vi.spyOn(document, "cookie", "set").mockImplementation(() => {
    throw new Error("Cookies unavailable")
  })
  try {
    const user = userEvent.setup()
    render(<SidebarHarness />)
    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }))
    expect(desktopSidebar()).toHaveAttribute("data-state", "collapsed")
  } finally {
    setter.mockRestore()
  }
})

it("uses the default and still toggles when reading cookies fails", async () => {
  const getter = vi.spyOn(document, "cookie", "get").mockImplementation(() => {
    throw new Error("Cookies unavailable")
  })
  try {
    const user = userEvent.setup()
    render(<SidebarHarness />)
    expect(desktopSidebar()).toHaveAttribute("data-state", "expanded")
    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }))
    expect(desktopSidebar()).toHaveAttribute("data-state", "collapsed")
  } finally {
    getter.mockRestore()
  }
})

it("restores and saves mobile visibility independently from desktop state", async () => {
  viewport.mobile = true
  document.cookie = "sidebar_state=false; path=/"
  document.cookie = "sidebar_mobile_state=true; path=/"
  const user = userEvent.setup()
  let view = render(<SidebarHarness />)
  expect(screen.getByRole("dialog", { name: "Sidebar" })).toBeVisible()
  view.unmount()
  view = render(<SidebarHarness />)
  expect(screen.getByRole("dialog", { name: "Sidebar" })).toBeVisible()
  await user.click(screen.getByRole("button", { name: "Close sidebar" }))
  expect(
    screen.queryByRole("dialog", { name: "Sidebar" })
  ).not.toBeInTheDocument()
  expect(document.cookie).toContain("sidebar_mobile_state=false")
  expect(document.cookie).toContain("sidebar_state=false")
  view.unmount()
  render(<SidebarHarness />)
  expect(
    screen.queryByRole("dialog", { name: "Sidebar" })
  ).not.toBeInTheDocument()
})
