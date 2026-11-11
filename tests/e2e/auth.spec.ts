import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Welcome back." })
  ).toBeVisible()
})

test("displays project branding and supports keyboard navigation", async ({
  page,
}, testInfo) => {
  await expect(page).toHaveTitle("Support Hub")
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect(
    page.getByRole("link", { name: "Support Hub — home" })
  ).toBeVisible()
  if (testInfo.project.name === "desktop") {
    const illustration = page.getByRole("img", {
      name: "Team working together to provide support",
    })
    await expect(illustration).toBeVisible()
    await expect(illustration).toHaveJSProperty("naturalWidth", 615)
  }
  await page.getByLabel("Email").fill("test@example.com")
  await page.getByLabel("Email").press("Tab")
  await expect(
    page.getByRole("button", { name: "Forgot your password?" })
  ).toBeFocused()
  await page
    .getByRole("button", { name: "Forgot your password?" })
    .press("Enter")
  await expect(
    page.getByRole("heading", { name: "Forgot your password?", exact: true })
  ).toBeFocused()
})

test("blocks sign-in with empty fields or an invalid email address", async ({
  page,
}) => {
  const submit = page.getByRole("button", { name: "Sign in" })
  await submit.click()
  await expect(page.getByLabel("Email")).toBeFocused()
  expect(
    await page
      .getByLabel("Email")
      .evaluate((input: HTMLInputElement) => input.validity.valueMissing)
  ).toBe(true)
  await page.getByLabel("Email").fill("invalid-email")
  await page.getByLabel("Password", { exact: true }).fill("Test12345")
  await submit.click()
  expect(
    await page
      .getByLabel("Email")
      .evaluate((input: HTMLInputElement) => input.validity.typeMismatch)
  ).toBe(true)
  await expect(page.getByRole("status")).toHaveCount(0)
})

test("toggles password visibility and submits demo sign-in", async ({
  page,
}) => {
  await page.getByLabel("Email").fill("test@example.com")
  const password = page.getByLabel("Password", { exact: true })
  await password.fill("Test12345")
  await page.getByRole("button", { name: "Show password", exact: true }).click()
  await expect(password).toHaveAttribute("type", "text")
  await page.getByRole("button", { name: "Hide password", exact: true }).click()
  await expect(password).toHaveAttribute("type", "password")
  await password.press("Enter")
  await expect(page.getByRole("status")).toContainText(
    "account access is unavailable"
  )
  await expect(page).toHaveURL("/")
})

test("requires at least eight characters when registering", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Create your account" }).click()
  await page.getByLabel("Email").fill("test@example.com")
  await page.getByLabel("Password", { exact: true }).fill("1234567")
  await page.getByLabel("Confirm password").fill("1234567")
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused()
  expect(
    await page
      .getByLabel("Password", { exact: true })
      .evaluate((input: HTMLInputElement) => input.validity.tooShort)
  ).toBe(true)
  await expect(page.getByRole("status")).toHaveCount(0)
})

test("corrects mismatched passwords and completes demo registration", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Create your account" }).click()
  await expect(
    page.getByRole("heading", { name: "Create your account." })
  ).toBeFocused()
  await page.getByLabel("Email").fill("test@example.com")
  await page.getByLabel("Password", { exact: true }).fill("Test12345")
  const confirmation = page.getByLabel("Confirm password")
  await confirmation.fill("Different123")
  await page.getByRole("button", { name: "Create account" }).click()
  const error = page
    .getByRole("region", { name: "Support Hub access" })
    .getByRole("alert")
  await expect(error).toContainText("Passwords do not match")
  await expect(confirmation).toBeFocused()
  await expect(confirmation).toHaveAttribute("aria-invalid", "true")
  await confirmation.fill("Test12345")
  await expect(error).toHaveCount(0)
  await page.getByRole("button", { name: "Show password confirmation" }).click()
  await expect(confirmation).toHaveAttribute("type", "text")
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password"
  )
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("status")).toContainText("no account is created")
  await page.getByRole("button", { name: "Back to sign in" }).click()
  await expect(page.getByLabel("Email")).toHaveValue("")
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password"
  )
  await expect(page.getByRole("status")).toHaveCount(0)
})

test("validates the recovery email and returns to sign-in", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Forgot your password?" }).click()
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "Reset password" }).click()
  await expect(page.getByLabel("Email")).toBeFocused()
  await expect(page.getByRole("status")).toHaveCount(0)
  await page.getByLabel("Email").fill("test@example.com")
  await page.getByRole("button", { name: "Reset password" }).click()
  await expect(page.getByRole("status")).toContainText(
    "no recovery email was sent"
  )
  await page.getByRole("button", { name: "Back to sign in" }).click()
  await expect(
    page.getByRole("heading", { name: "Welcome back." })
  ).toBeFocused()
  await expect(page.getByRole("status")).toHaveCount(0)
})

test("keeps forms accessible without horizontal scrolling", async ({
  page,
}) => {
  for (const mode of ["login", "register", "recovery"]) {
    if (mode === "register")
      await page.getByRole("button", { name: "Create your account" }).click()
    if (mode === "recovery") {
      await page.getByRole("button", { name: "Back to sign in" }).click()
      await page.getByRole("button", { name: "Forgot your password?" }).click()
    }
    await expect(page.getByLabel("Email")).toBeVisible()
    const submit = page.getByRole("button", {
      name: /^(Sign in|Create account|Reset password)$/,
    })
    await submit.scrollIntoViewIfNeeded()
    await expect(submit).toBeInViewport()
    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }))
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
  }
})
