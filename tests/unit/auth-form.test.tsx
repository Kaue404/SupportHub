import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { AuthForm } from "@/components/auth-form"

function setup() {
  const user = userEvent.setup()
  render(<AuthForm />)
  return user
}

describe("AuthForm", () => {
  it("uses English labels, placeholders, and navigation in every form", async () => {
    const user = setup()
    expect(screen.getByText("New here?")).toBeVisible()
    expect(screen.getByPlaceholderText("you@example.com")).toHaveAccessibleName(
      "Email"
    )
    expect(
      screen.getByPlaceholderText("Enter your password")
    ).toHaveAccessibleName("Password")
    await user.click(
      screen.getByRole("button", { name: "Create your account" })
    )
    expect(screen.getByText("Already have an account?")).toBeVisible()
    expect(
      screen.getByPlaceholderText("Create a password")
    ).toHaveAccessibleName("Password")
    expect(
      screen.getByPlaceholderText("Repeat your password")
    ).toHaveAccessibleName("Confirm password")
    await user.click(screen.getByRole("button", { name: "Back to sign in" }))
    await user.click(
      screen.getByRole("button", { name: "Forgot your password?" })
    )
    expect(screen.getByText("Already have an account?")).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Forgot your password?" })
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Reset password" })).toBeVisible()
  })
  it("starts on sign-in with required email and password fields", () => {
    setup()
    expect(screen.getByRole("heading", { name: "Welcome back." })).toBeVisible()
    expect(screen.getByLabelText("Email")).toBeRequired()
    expect(screen.getByLabelText("Password", { exact: true })).toBeRequired()
    expect(screen.queryByLabelText("Confirm password")).not.toBeInTheDocument()
  })

  it("shows and hides the password without submitting the form", async () => {
    const user = setup()
    const password = screen.getByLabelText("Password", { exact: true })
    await user.type(password, "TestPassword123")
    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(password).toHaveAttribute("type", "text")
    expect(
      screen.getByRole("button", { name: "Hide password" })
    ).toHaveAttribute("aria-pressed", "true")
    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(password).toHaveAttribute("type", "password")
    expect(password).toHaveValue("TestPassword123")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("blocks submission when required fields are empty", async () => {
    const user = setup()
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(screen.getByLabelText("Email")).toBeInvalid()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("rejects an invalid email address", async () => {
    const user = setup()
    await user.type(screen.getByLabelText("Email"), "invalid-email")
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Test12345"
    )
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(screen.getByLabelText("Email")).toBeInvalid()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("identifies sign-in as a demo after valid submission", async () => {
    const user = setup()
    await user.type(screen.getByLabelText("Email"), "test@example.com")
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Test12345"
    )
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(screen.getByRole("status")).toHaveTextContent(
      "account access is unavailable"
    )
  })

  it("opens registration and focuses the heading", async () => {
    const user = setup()
    await user.click(
      screen.getByRole("button", { name: "Create your account" })
    )
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Create your account." })
      ).toHaveFocus()
    )
    expect(screen.getByLabelText("Confirm password")).toBeRequired()
    expect(
      screen.getByLabelText("Password", { exact: true })
    ).toHaveAccessibleDescription("Use at least 8 characters.")
  })

  it("announces mismatched passwords and focuses confirmation", async () => {
    const user = setup()
    await user.click(
      screen.getByRole("button", { name: "Create your account" })
    )
    await user.type(screen.getByLabelText("Email"), "test@example.com")
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Test12345"
    )
    await user.type(screen.getByLabelText("Confirm password"), "Different123")
    await user.click(screen.getByRole("button", { name: "Create account" }))
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Passwords do not match"
    )
    expect(screen.getByLabelText("Confirm password")).toHaveFocus()
    expect(
      screen.getByLabelText("Confirm password")
    ).toHaveAccessibleDescription("Passwords do not match.")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("allows correcting passwords and completing demo registration", async () => {
    const user = setup()
    await user.click(
      screen.getByRole("button", { name: "Create your account" })
    )
    await user.type(screen.getByLabelText("Email"), "test@example.com")
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Test12345"
    )
    const confirmation = screen.getByLabelText("Confirm password")
    await user.type(confirmation, "Different123")
    await user.click(screen.getByRole("button", { name: "Create account" }))
    await user.clear(confirmation)
    await user.type(confirmation, "Test12345")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(confirmation).toHaveAttribute("aria-invalid", "false")
    await user.click(screen.getByRole("button", { name: "Create account" }))
    expect(screen.getByRole("status")).toHaveTextContent(
      "no account is created"
    )
  })

  it("toggles confirmation visibility without revealing the password", async () => {
    const user = setup()
    await user.click(
      screen.getByRole("button", { name: "Create your account" })
    )
    await user.click(
      screen.getByRole("button", { name: "Show password confirmation" })
    )
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "type",
      "text"
    )
    expect(screen.getByLabelText("Password", { exact: true })).toHaveAttribute(
      "type",
      "password"
    )
    await user.click(
      screen.getByRole("button", { name: "Hide password confirmation" })
    )
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "type",
      "password"
    )
  })

  it("accepts an email for recovery and discloses that no message was sent", async () => {
    const user = setup()
    await user.click(
      screen.getByRole("button", { name: "Forgot your password?" })
    )
    expect(
      screen.queryByLabelText("Password", { exact: true })
    ).not.toBeInTheDocument()
    await user.type(screen.getByLabelText("Email"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Reset password" }))
    expect(screen.getByRole("status")).toHaveTextContent(
      "no recovery email was sent"
    )
  })

  it("resets fields, feedback, and visibility when switching forms", async () => {
    const user = setup()
    await user.type(screen.getByLabelText("Email"), "test@example.com")
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Test12345"
    )
    await user.click(screen.getByRole("button", { name: "Show password" }))
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    await user.click(
      screen.getByRole("button", { name: "Create your account" })
    )
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toHaveValue("")
    expect(screen.getByLabelText("Password", { exact: true })).toHaveValue("")
    expect(screen.getByLabelText("Password", { exact: true })).toHaveAttribute(
      "type",
      "password"
    )
    await user.click(screen.getByRole("button", { name: "Back to sign in" }))
    expect(screen.getByRole("heading", { name: "Welcome back." })).toBeVisible()
  })
})
