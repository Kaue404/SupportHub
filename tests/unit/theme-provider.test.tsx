import type { ReactNode } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, expect, it, vi } from "vitest"
import { ThemeProvider } from "@/components/theme-provider"

const theme = vi.hoisted(() => ({ resolvedTheme: "light", setTheme: vi.fn() }))
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
  useTheme: () => theme,
}))

beforeEach(() => {
  theme.resolvedTheme = "light"
  theme.setTheme.mockClear()
})

function renderProvider() {
  return render(
    <ThemeProvider>
      <input aria-label="Name" />
      <textarea aria-label="Description" />
      <select aria-label="Workspace">
        <option>Demo workspace</option>
      </select>
    </ThemeProvider>
  )
}

it.each([undefined, null, 42])(
  "ignores keyboard events with a non-string key (%s) without crashing",
  (key) => {
    renderProvider()
    const errors = vi.fn((event: ErrorEvent) => event.preventDefault())
    window.addEventListener("error", errors)
    try {
      for (const target of [window, screen.getByLabelText("Name")]) {
        const event = new Event("keydown", { bubbles: true })
        Object.defineProperty(event, "key", { value: key })
        target.dispatchEvent(event)
      }
      expect(errors).not.toHaveBeenCalled()
      expect(theme.setTheme).not.toHaveBeenCalled()
    } finally {
      window.removeEventListener("error", errors)
    }
  }
)

it("keeps typing names containing D from changing the theme", async () => {
  const user = userEvent.setup()
  renderProvider()
  await user.type(screen.getByLabelText("Name"), "Diana Reed")
  expect(screen.getByLabelText("Name")).toHaveValue("Diana Reed")
  expect(theme.setTheme).not.toHaveBeenCalled()
})

it.each(["Name", "Description", "Workspace"])(
  "ignores the theme shortcut in the %s field",
  (label) => {
    renderProvider()
    fireEvent.keyDown(screen.getByLabelText(label), { key: "D" })
    expect(theme.setTheme).not.toHaveBeenCalled()
  }
)

it("ignores composition, repeated keys and modified shortcuts", () => {
  renderProvider()
  for (const options of [
    { isComposing: true },
    { repeat: true },
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
  ]) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", ...options }))
  }
  expect(theme.setTheme).not.toHaveBeenCalled()
})

it.each([
  ["light", "d", "dark"],
  ["dark", "D", "light"],
])("switches %s using %s to %s outside fields", (current, key, next) => {
  theme.resolvedTheme = current
  renderProvider()
  fireEvent.keyDown(window, { key })
  expect(theme.setTheme).toHaveBeenCalledExactlyOnceWith(next)
})
