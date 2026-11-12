import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it } from "vitest"
import ProfilePage from "@/app/profile/page"
import { WorkspaceShell } from "@/components/workspace-shell"

function renderWorkspace() {
  return render(
    <WorkspaceShell page="Overview">
      <h1>Workspace content</h1>
    </WorkspaceShell>
  )
}

it("keeps overview navigation available and marks it as current only on the overview page", () => {
  const { rerender } = renderWorkspace()
  const navigation = screen.getByRole("navigation", { name: "Main navigation" })
  expect(
    within(navigation).getByRole("link", { name: "Overview" })
  ).toHaveAttribute("aria-current", "page")
  rerender(
    <WorkspaceShell page="Profile">
      <h1>Profile content</h1>
    </WorkspaceShell>
  )
  const overview = within(navigation).getByRole("link", { name: "Overview" })
  expect(overview).not.toHaveAttribute("aria-current")
  expect(overview).toHaveAttribute("href", "/home")
  expect(overview).not.toHaveAttribute("aria-disabled", "true")
})

it.each(["expanded", "collapsed"])(
  "opens the profile popover by keyboard with the sidebar %s and restores focus on Escape",
  async (state) => {
    const user = userEvent.setup()
    renderWorkspace()
    if (state === "collapsed") {
      await user.click(screen.getByRole("button", { name: "Toggle sidebar" }))
    }
    const trigger = screen.getByRole("button", { name: "Open profile menu" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    trigger.focus()
    await user.keyboard("{Enter}")
    const popover = screen.getByRole("dialog", { name: "Profile menu" })
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(within(popover).getByRole("link", { name: "Profile" })).toHaveFocus()
    await user.tab()
    expect(
      within(popover).getByRole("link", { name: "Sign out" })
    ).toHaveFocus()
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  }
)

it.each([
  ["Profile", "/profile"],
  ["Sign out", "/"],
])(
  "links %s to %s and closes the popover when selected",
  async (name, href) => {
    const user = userEvent.setup()
    renderWorkspace()
    await user.click(screen.getByRole("button", { name: "Open profile menu" }))
    const link = screen.getByRole("link", { name })
    expect(link).toHaveAttribute("href", href)
    link.addEventListener("click", (event) => event.preventDefault())
    await user.click(link)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Open profile menu" })
    ).toHaveAttribute("aria-expanded", "false")
  }
)

it("dismisses the popover on an outside click and keeps the theme toggle separate", async () => {
  const user = userEvent.setup()
  renderWorkspace()
  await user.click(screen.getByRole("button", { name: "Toggle theme" }))
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Open profile menu" }))
  await user.click(screen.getByRole("heading", { name: "Workspace content" }))
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
})

it("shows the workspace breadcrumb on overview", () => {
  renderWorkspace()
  expect(
    screen.getByRole("navigation", { name: "Page navigation" })
  ).toHaveTextContent("WorkspaceOverview")
})

it("shows only the page name in the profile breadcrumb without a duplicate heading", () => {
  render(<ProfilePage />)
  expect(screen.getByRole("main", { name: "Profile" })).toBeVisible()
  expect(
    screen.queryByRole("heading", { name: "Profile", level: 1 })
  ).not.toBeInTheDocument()
  const details = screen.getByRole("region", { name: "Profile details" })
  expect(within(details).getByRole("textbox", { name: "Name" })).toHaveValue(
    "Support workspace"
  )
  expect(
    within(details).getByRole("textbox", { name: "Description" })
  ).toHaveValue("")
  expect(
    within(details).getByRole("textbox", { name: "Workspace" })
  ).toHaveValue("Demo workspace")
  const breadcrumb = screen.getByRole("navigation", { name: "Page navigation" })
  expect(breadcrumb).toHaveTextContent(/^Profile$/)
  expect(within(breadcrumb).getAllByRole("listitem")).toHaveLength(1)
  expect(
    within(breadcrumb).getByRole("link", { name: "Profile" })
  ).toHaveAttribute("aria-current", "page")
  expect(
    within(
      screen.getByRole("navigation", { name: "Main navigation" })
    ).getByRole("link", { name: "Overview" })
  ).not.toHaveAttribute("aria-current")
})
