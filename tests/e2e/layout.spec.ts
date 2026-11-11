import { expect, test, type Page } from "@playwright/test"

async function expectContentToFit(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportWidth: document.documentElement.clientWidth,
    viewportHeight: document.documentElement.clientHeight,
  }))
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewportWidth)
  expect(dimensions.height).toBeLessThanOrEqual(dimensions.viewportHeight)
  await expect(
    page.getByRole("link", { name: "Support Hub — home" })
  ).toBeInViewport({ ratio: 1 })
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport({
    ratio: 1,
  })
  const panel = page.getByRole("region", { name: "Support Hub access" })
  for (const element of await panel
    .locator(
      "input, button, h2, footer, .form-divider, .form-assurance, [role='alert'], [role='status']"
    )
    .all()) {
    await expect(element).toBeInViewport({ ratio: 1 })
  }
  const panelDimensions = await panel.evaluate((element) => ({
    content: element.scrollHeight,
    available: element.clientHeight,
  }))
  expect(
    panelDimensions.content,
    "The access panel must not overflow"
  ).toBeLessThanOrEqual(panelDimensions.available)
  const formBounds = await panel.locator(".auth-form-content").boundingBox()
  const footerBounds = await panel.locator("footer").boundingBox()
  expect(formBounds).not.toBeNull()
  expect(footerBounds).not.toBeNull()
  expect(
    formBounds!.y + formBounds!.height,
    "The form must not overlap the footer"
  ).toBeLessThanOrEqual(footerBounds!.y)
}

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 600 },
  { width: 390, height: 844 },
  { width: 360, height: 640 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`fits every flow without scrolling at ${viewport.width} × ${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await expect(
      page.getByRole("link", { name: "Support Hub — home" })
    ).toHaveText("Support Hub")
    await expectContentToFit(page)

    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password", { exact: true }).fill("Test12345")
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page.getByRole("status")).toBeVisible()
    await expectContentToFit(page)

    await page.getByRole("button", { name: "Create your account" }).click()
    await expectContentToFit(page)
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password", { exact: true }).fill("Test12345")
    await page.getByLabel("Confirm password").fill("Different123")
    await page.getByRole("button", { name: "Create account" }).click()
    await expect(
      page.getByText("Passwords do not match.", { exact: true })
    ).toBeVisible()
    await expectContentToFit(page)
    await page.getByLabel("Confirm password").fill("Test12345")
    await page.getByRole("button", { name: "Create account" }).click()
    await expect(page.getByRole("status")).toBeVisible()
    await expectContentToFit(page)

    if (
      testInfo.project.name === "desktop" &&
      [1366, 360].includes(viewport.width)
    ) {
      await page.screenshot({ path: testInfo.outputPath("registration.png") })
    }

    await page.getByRole("button", { name: "Back to sign in" }).click()
    await page.getByRole("button", { name: "Forgot your password?" }).click()
    await expectContentToFit(page)
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByRole("button", { name: "Reset password" }).click()
    await expect(page.getByRole("status")).toBeVisible()
    await expectContentToFit(page)
  })
}
