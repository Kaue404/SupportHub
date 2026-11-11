import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Link from "next/link"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("triggers the action using the keyboard", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Continue</Button>)
    await user.tab()
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("does not trigger the action when disabled", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Continue
      </Button>
    )
    await user.click(screen.getByRole("button", { name: "Continue" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("preserves navigation and accessible names when rendered as a link", () => {
    render(
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    )
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/"
    )
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
