import { expect, test, type Page } from "@playwright/test"

async function selectOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click()
  await page.getByRole("option", { name: option, exact: true }).click()
}

test("opens home from the brand and keeps filters and pagination in the URL", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Support Hub — home" }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Support overview"
  )
  await expect(
    page
      .getByRole("row")
      .filter({
        has: page.getByRole("button", { name: "Unable to access my account" }),
      })
      .getByRole("cell", { name: "11/11/2026" })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth
    )
  ).toBe(true)
  await page.getByRole("button", { name: "Next page" }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(
    page.getByRole("button", { name: "Change workspace name" })
  ).toBeVisible()
  await selectOption(page, "Filter by status", "Open")
  await expect(page).toHaveURL(/status=Open/)
  await expect(page).not.toHaveURL(/page=/)
  await selectOption(page, "Filter by priority", "Urgent")
  await page.getByLabel("Search tickets").fill("account")
  await expect(
    page.getByRole("button", { name: "Unable to access my account" })
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel("Search tickets")).toHaveValue("account")
  await expect(page.getByLabel("Filter by priority")).toHaveText("Urgent")
  await page.getByLabel("Search tickets").fill("no matching ticket")
  await expect(
    page.getByRole("heading", { name: "No tickets found" })
  ).toBeVisible()
  const searchHeight = await page
    .getByLabel("Search tickets")
    .evaluate(
      (element) =>
        element.closest('[data-slot="input-group"]')!.getBoundingClientRect()
          .height
    )
  const clearFilters = page.getByRole("button", { name: "Clear filters" })
  await expect(clearFilters).toHaveCSS("height", `${searchHeight}px`)
  await expect(page.getByLabel("Filter by status")).toHaveCSS(
    "height",
    `${searchHeight}px`
  )
  await expect(page.getByLabel("Filter by priority")).toHaveCSS(
    "height",
    `${searchHeight}px`
  )
  await clearFilters.click()
  await expect(page.getByText("Page 1 of 2")).toBeVisible()
  await page.goBack()
  await expect(page.getByLabel("Search tickets")).toHaveValue(
    "no matching ticket"
  )
})

test("previews conversation, changes priority, resolves and persists a ticket", async ({
  page,
}) => {
  await page.goto("/home")
  await page
    .getByRole("button", { name: "Unable to access my account" })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "The sign-in page keeps returning an error."
  )
  await page.keyboard.press("Escape")
  await expect(
    page.getByRole("button", { name: "Unable to access my account" })
  ).toBeFocused()
  await selectOption(page, "Priority for SH-1048", "Low")
  const resolve = page.getByRole("button", { name: "Resolve SH-1048" })
  await expect(resolve).toBeEnabled()
  const activeBackground = await resolve.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  )
  expect(activeBackground).not.toBe("rgba(0, 0, 0, 0)")
  await page.getByRole("button", { name: "Resolve SH-1048" }).click()
  await expect(page.getByRole("status")).toHaveText("SH-1048 resolved.")
  await page.reload()
  await expect(page.getByLabel("Priority for SH-1048")).toHaveText("Low")
  await expect(
    page.getByRole("button", { name: "Resolve SH-1048" })
  ).toBeDisabled()
  await expect(resolve).toHaveText("Resolved")
  const resolvedBackground = await resolve.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  )
  expect(resolvedBackground).not.toBe(activeBackground)
})

test("validates a new ticket and displays it after saving", async ({
  page,
}, testInfo) => {
  await page.goto("/home?status=Resolved&page=2")
  await page.getByRole("button", { name: "New ticket" }).click()
  await page.getByRole("button", { name: "Create ticket" }).click()
  await expect(page.getByLabel("Subject")).toBeFocused()
  await page.getByLabel("Subject").fill("Printer is offline")
  await page
    .getByLabel("Description")
    .fill("The office printer stopped responding.")
  await selectOption(page, "Priority", "High")
  await page.getByRole("button", { name: "Create ticket" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page).toHaveURL(/\/home$/)
  await expect(
    page.getByRole("button", { name: "Printer is offline" })
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("button", { name: "Printer is offline" })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath("home.png"),
    fullPage: true,
  })
})

test("handles malformed links and empty results", async ({ page }) => {
  await page.goto("/home?page=999&status=Open&priority=Urgent")
  await expect(page.getByText("Page 1 of 1")).toBeVisible()
  await page.getByRole("button", { name: "Resolve SH-1048" }).click()
  await expect(
    page.getByRole("heading", { name: "No tickets found" })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled()
})

test("switches themes and preserves the preference across home and login", async ({
  page,
}) => {
  await page.addInitScript(
    () =>
      localStorage.getItem("theme") || localStorage.setItem("theme", "light")
  )
  await page.goto("/home")
  if (!(await page.getByRole("button", { name: "Toggle theme" }).isVisible())) {
    await page.getByRole("button", { name: "Open sidebar" }).click()
  }
  await page.getByRole("button", { name: "Toggle theme" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.goto("/")
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByRole("button", { name: "Toggle theme" }).click()
  await expect(page.locator("html")).not.toHaveClass(/dark/)
})

test("keeps the sidebar flush with the viewport, collapsible, and the profile at the bottom", async ({
  page,
}, testInfo) => {
  await page.goto("/home")
  const mobile = testInfo.project.name === "mobile"
  if (mobile) await page.getByRole("button", { name: "Open sidebar" }).click()
  const sidebar = page.locator(
    mobile
      ? '[data-slot="sidebar"][data-mobile="true"]'
      : '[data-slot="sidebar-container"]'
  )
  await expect(sidebar).toBeVisible()
  await expect(
    sidebar.getByRole("button", { name: "Toggle sidebar" })
  ).toBeVisible()
  await sidebar.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished)
    )
  })
  const bounds = await sidebar.boundingBox()
  expect(bounds!.x).toBe(0)
  expect(bounds!.y).toBe(0)
  const profile = sidebar.locator('[data-slot="sidebar-footer"]')
  await expect(
    profile.getByRole("button", { name: "Toggle theme" })
  ).toBeVisible()
  const profileBounds = await profile.boundingBox()
  expect(
    Math.abs(profileBounds!.y + profileBounds!.height - bounds!.height)
  ).toBeLessThanOrEqual(2)
  await expect(sidebar).toHaveCSS("border-top-left-radius", "0px")
  const headerDivider = sidebar.locator('[data-slot="sidebar-separator"]')
  await expect(headerDivider).not.toBeVisible()
  if (mobile) {
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
    await expect(sidebar).not.toBeVisible()
  } else {
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
    await expect(sidebar).toHaveCSS("width", "64px")
    await expect(headerDivider).toBeVisible()
    await expect(headerDivider).toHaveCSS("height", "1px")
    await expect(headerDivider).toHaveCSS(
      "background-color",
      await profile.evaluate(
        (element) => getComputedStyle(element).borderTopColor
      )
    )
    await expect(
      profile.getByRole("button", { name: "Toggle theme" })
    ).toBeVisible()
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Overview", exact: true })
    ).toBeVisible()
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
    await expect(sidebar).toHaveCSS("width", "244px")
    await expect(headerDivider).not.toBeVisible()
  }
  await expect(page.locator(".hub-topbar")).toHaveCSS("height", "48px")
})

for (const theme of ["light", "dark"]) {
  test(`uses matching filter surfaces and a neutral row hover in ${theme} theme`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme
    )
    await page.goto("/home")
    const search = page
      .locator('[data-slot="input-group"]')
      .filter({ has: page.getByLabel("Search tickets") })
    const background = await search.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    )
    await expect(
      page.getByRole("combobox", { name: "Filter by status" })
    ).toHaveCSS("background-color", background)
    await expect(
      page.getByRole("combobox", { name: "Filter by priority" })
    ).toHaveCSS("background-color", background)
    if (testInfo.project.name === "desktop") {
      const row = page.getByRole("row").filter({
        has: page.getByRole("button", {
          name: "Unable to access my account",
        }),
      })
      await row.hover()
      await row.evaluate(async (element) => {
        await Promise.all(
          element.getAnimations().map((animation) => animation.finished)
        )
      })
      const colors = await row.evaluate((element) => {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")!
        function rgb(color: string) {
          context.clearRect(0, 0, 1, 1)
          context.fillStyle = color
          context.fillRect(0, 0, 1, 1)
          return [...context.getImageData(0, 0, 1, 1).data]
        }
        return {
          hover: rgb(getComputedStyle(element).backgroundColor),
          base: rgb(
            getComputedStyle(element.closest('[data-slot="card"]')!)
              .backgroundColor
          ),
        }
      })
      expect(colors.hover[0]).toBeLessThanOrEqual(
        Math.max(colors.hover[1], colors.hover[2])
      )
      if (theme === "dark")
        expect(colors.hover[1]).toBeGreaterThan(colors.base[1])
      expect(colors.hover).not.toEqual(colors.base)
    }
    await page.screenshot({
      path: testInfo.outputPath(`home-${theme}.png`),
      fullPage: true,
    })
  })
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`animates sidebar toggles with ${reducedMotion} motion preference`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion })
    await page.goto("/home")
    if (testInfo.project.name === "mobile") {
      await page.evaluate(() => {
        document.documentElement.dataset.sidebarMotion = "false"
        document.addEventListener("animationstart", (event) => {
          if (
            (event.target as Element).matches(
              '[data-slot="sidebar"][data-mobile="true"]'
            )
          ) {
            document.documentElement.dataset.sidebarMotion = "true"
          }
        })
        document.addEventListener("animationend", (event) => {
          if (
            (event.target as Element).matches(
              '[data-slot="sidebar"][data-mobile="true"]'
            )
          ) {
            document.documentElement.dataset.sidebarElapsed = String(
              event.elapsedTime
            )
          }
        })
      })
      await page.getByRole("button", { name: "Open sidebar" }).click()
      const mobileSidebar = page.locator(
        '[data-slot="sidebar"][data-mobile="true"]'
      )
      await mobileSidebar.evaluate(async (element) => {
        await Promise.all(
          element.getAnimations().map((animation) => animation.finished)
        )
      })
      await expect(page.locator("html")).toHaveAttribute(
        "data-sidebar-motion",
        String(reducedMotion === "no-preference")
      )
      if (reducedMotion === "no-preference") {
        await expect
          .poll(async () =>
            Number(
              await page.locator("html").getAttribute("data-sidebar-elapsed")
            )
          )
          .toBeGreaterThanOrEqual(0.4)
      }
      await mobileSidebar
        .getByRole("button", { name: "Toggle sidebar" })
        .click()
      await expect(mobileSidebar).not.toBeVisible()
      return
    }
    const sidebar = page.locator('[data-slot="sidebar-container"]')
    const toggle = sidebar.getByRole("button", { name: "Toggle sidebar" })
    await sidebar.evaluate((element) => {
      element.addEventListener("transitionrun", (event) => {
        if (
          event.target === element &&
          (event as TransitionEvent).propertyName === "width"
        ) {
          element.setAttribute("data-motion-observed", "true")
        }
      })
      element.addEventListener("transitionend", (event) => {
        if (
          event.target === element &&
          (event as TransitionEvent).propertyName === "width"
        ) {
          element.setAttribute(
            "data-motion-elapsed",
            String((event as TransitionEvent).elapsedTime)
          )
        }
      })
    })
    for (const width of ["64px", "244px"]) {
      await sidebar.evaluate((element) => {
        element.setAttribute("data-motion-observed", "false")
        element.setAttribute("data-motion-elapsed", "0")
      })
      await toggle.click()
      await expect(sidebar).toHaveCSS("width", width)
      await expect(sidebar).toHaveAttribute(
        "data-motion-observed",
        String(reducedMotion === "no-preference")
      )
      if (reducedMotion === "no-preference") {
        await expect
          .poll(async () =>
            Number(await sidebar.getAttribute("data-motion-elapsed"))
          )
          .toBeGreaterThanOrEqual(0.4)
      }
    }
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Overview" })
    ).toBeVisible()
  })
}
