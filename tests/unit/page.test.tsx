import { render, screen } from "@testing-library/react"
import { expect, it } from "vitest"

import Page from "@/app/page"

it("separates Support and Hub in the brand name", () => {
  render(<Page />)
  expect(
    screen.getByRole("link", { name: "Support Hub — home" })
  ).toHaveTextContent("Support Hub")
})
