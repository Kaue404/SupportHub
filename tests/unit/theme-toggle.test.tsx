import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"
import { ThemeToggle } from "@/components/theme-toggle"

const theme = vi.hoisted(() => ({ resolvedTheme: "light", setTheme: vi.fn() }))
vi.mock("next-themes", () => ({ useTheme: () => theme }))

it("switches between light and dark through an accessible button", async () => {
  const user = userEvent.setup()
  const { rerender } = render(<ThemeToggle />)
  await user.click(screen.getByRole("button", { name: "Toggle theme" }))
  expect(theme.setTheme).toHaveBeenLastCalledWith("dark")
  theme.resolvedTheme = "dark"
  rerender(<ThemeToggle />)
  await user.click(screen.getByRole("button", { name: "Toggle theme" }))
  expect(theme.setTheme).toHaveBeenLastCalledWith("light")
})
