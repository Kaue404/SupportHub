import { render, screen, within, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, expect, it, vi } from "vitest"
import { TicketDashboard } from "@/components/ticket-dashboard"
import { initialTickets, parseTickets } from "@/lib/tickets"

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, "", "/home")
})

it("shows the full creation date in month/day/year order using UTC", () => {
  localStorage.setItem(
    "support-hub-tickets-v1",
    JSON.stringify([
      { ...initialTickets[0], createdAt: "2027-01-01T00:00:00.000Z" },
    ])
  )
  render(<TicketDashboard />)
  expect(screen.getByRole("cell", { name: "01/01/2027" })).toBeVisible()
})

it("disables the resolved action while keeping other tickets actionable", async () => {
  render(<TicketDashboard />)
  await userEvent.click(screen.getByRole("button", { name: "Resolve SH-1048" }))
  expect(screen.getByRole("button", { name: "Resolve SH-1048" })).toBeDisabled()
  expect(
    screen.getByRole("button", { name: "Resolve SH-1048" })
  ).toHaveTextContent("Resolved")
  expect(screen.getByRole("button", { name: "Resolve SH-1047" })).toBeEnabled()
})

it("clears active filters and pagination while preserving unrelated URL parameters", async () => {
  window.history.replaceState(
    null,
    "",
    "/home?q=account&status=Open&priority=Urgent&page=2&source=test"
  )
  render(<TicketDashboard />)
  await userEvent.click(screen.getByRole("button", { name: "Clear filters" }))
  expect(window.location.search).toBe("?source=test")
})

it("filters from the URL, combines search and filters, and clamps invalid pages", () => {
  window.history.replaceState(
    null,
    "",
    "/home?q=account&status=Open&priority=Urgent&page=999"
  )
  render(<TicketDashboard />)
  expect(
    screen.getByRole("button", { name: "Unable to access my account" })
  ).toBeVisible()
  expect(
    screen.queryByRole("button", { name: "Monthly report is not loading" })
  ).not.toBeInTheDocument()
  expect(screen.getByText("Page 1 of 1")).toBeVisible()
  expect(screen.getByLabelText("Search tickets")).toHaveValue("account")
})

it("resets pagination when filters change and preserves unrelated URL parameters", async () => {
  window.history.replaceState(null, "", "/home?page=2&source=test")
  render(<TicketDashboard />)
  await userEvent.click(
    screen.getByRole("combobox", { name: "Filter by status" })
  )
  await userEvent.click(screen.getByRole("option", { name: "Open" }))
  expect(window.location.search).toBe("?source=test&status=Open")
})

it("persists priority and resolution, updates counts and removes resolved tickets from an open filter", async () => {
  window.history.replaceState(null, "", "/home?status=Open")
  const user = userEvent.setup()
  render(<TicketDashboard />)
  await user.click(
    screen.getByRole("combobox", { name: "Priority for SH-1048" })
  )
  await user.click(screen.getByRole("option", { name: "Low" }))
  expect(screen.getByLabelText("Priority for SH-1048")).toHaveTextContent("Low")
  await user.click(screen.getByRole("button", { name: "Resolve SH-1048" }))
  expect(
    screen.queryByRole("button", { name: "Unable to access my account" })
  ).not.toBeInTheDocument()
  const saved = parseTickets(localStorage.getItem("support-hub-tickets-v1"))
  expect(saved.find((ticket) => ticket.id === "SH-1048")).toMatchObject({
    priority: "Low",
    status: "Resolved",
  })
  expect(screen.getByRole("status")).toHaveTextContent("SH-1048 resolved.")
})

it("opens the conversation and creates a ticket with validation", async () => {
  const user = userEvent.setup()
  render(<TicketDashboard />)
  await user.click(
    screen.getByRole("button", { name: "Unable to access my account" })
  )
  expect(
    within(screen.getByRole("dialog")).getByText(initialTickets[0].description)
  ).toBeVisible()
  await user.keyboard("{Escape}")
  await user.click(screen.getByRole("button", { name: "New ticket" }))
  await user.type(screen.getByLabelText("Subject"), "   ")
  await user.type(screen.getByLabelText("Description"), "Something happened")
  fireEvent.submit(
    screen.getByRole("button", { name: "Create ticket" }).closest("form")!
  )
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Enter a subject and description."
  )
  await user.clear(screen.getByLabelText("Subject"))
  await user.type(screen.getByLabelText("Subject"), "New issue")
  await user.click(screen.getByRole("button", { name: "Create ticket" }))
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: "New issue" })).toBeVisible()
})

it("reports storage errors without changing the ticket", async () => {
  const user = userEvent.setup()
  render(<TicketDashboard />)
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage unavailable")
  })
  await user.click(screen.getByRole("button", { name: "Resolve SH-1048" }))
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Your changes could not be saved."
  )
  expect(screen.getByRole("button", { name: "Resolve SH-1048" })).toBeEnabled()
  spy.mockRestore()
})

it("handles corrupt stored data and unsupported URL values", () => {
  expect(parseTickets("not json")).toEqual(initialTickets)
  expect(parseTickets('[{"id":"bad"}]')).toEqual(initialTickets)
  window.history.replaceState(
    null,
    "",
    "/home?status=invalid&priority=invalid&page=-1"
  )
  render(<TicketDashboard />)
  expect(screen.getByText("Page 1 of 2")).toBeVisible()
  expect(screen.getByLabelText("Filter by status")).toHaveTextContent(
    "All statuses"
  )
})

it("keeps overview navigation available through repeated sidebar toggles", async () => {
  const user = userEvent.setup()
  render(<TicketDashboard />)
  const toggle = screen.getByRole("button", { name: "Toggle sidebar" })
  expect(toggle.closest('[data-slot="sidebar-header"]')).toContainElement(
    toggle
  )
  await user.click(toggle)
  expect(
    screen
      .getByRole("button", { name: "Toggle theme" })
      .closest('[data-slot="sidebar-footer"]')
  ).toHaveTextContent("Support workspace")
  expect(
    within(
      screen.getByRole("navigation", { name: "Main navigation" })
    ).getByRole("link", { name: "Overview" })
  ).toHaveAttribute("href", "/home")
  await user.dblClick(toggle)
  await user.keyboard("{Control>}b{/Control}")
  expect(screen.getByText("Support workspace")).toBeVisible()
  expect(toggle).toBeEnabled()
  expect(screen.getByRole("button", { name: "Toggle theme" })).toBeEnabled()
})
