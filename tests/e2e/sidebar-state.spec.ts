import { expect, test } from "@playwright/test"

for (const path of ["/home", "/profile"]) {
  for (const open of [false, true]) {
    test(`renders ${path} ${open ? "expanded" : "collapsed"} before startup scripts and keeps it unchanged after hydration`, async ({
      context,
      page,
    }, testInfo) => {
      await context.addCookies([
        {
          name: "sidebar_state",
          value: String(open),
          url: "http://127.0.0.1:3100",
        },
        {
          name: "sidebar_mobile_state",
          value: String(open),
          url: "http://127.0.0.1:3100",
        },
      ])
      let releaseScripts!: () => void
      const scriptsBlocked = new Promise<void>((resolve) => {
        releaseScripts = resolve
      })
      await page.route("**/*", async (route) => {
        if (route.request().resourceType() === "script") await scriptsBlocked
        await route.continue()
      })
      const state = open ? "expanded" : "collapsed"
      const initialSidebar = page.locator(
        '[data-slot="sidebar"][data-variant="sidebar"]'
      )
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(error.message))
      try {
        await page.goto(path, { waitUntil: "commit" })
        await expect(initialSidebar).toHaveAttribute("data-state", state)
        if (testInfo.project.name === "desktop") {
          await expect(
            page.locator('[data-slot="sidebar-container"]')
          ).toHaveCSS("width", open ? "244px" : "64px")
        }
        await page.evaluate(() => {
          const sidebar = document.querySelector(
            '[data-slot="sidebar"][data-variant="sidebar"]'
          )!
          document.documentElement.dataset.sidebarHydrationStates =
            sidebar.getAttribute("data-state")!
          new MutationObserver(() => {
            const states =
              document.documentElement.dataset.sidebarHydrationStates!.split(
                ","
              )
            const next = sidebar.getAttribute("data-state")!
            if (states.at(-1) !== next) {
              document.documentElement.dataset.sidebarHydrationStates = [
                ...states,
                next,
              ].join(",")
            }
          }).observe(sidebar, {
            attributes: true,
            attributeFilter: ["data-state"],
          })
        })
      } finally {
        releaseScripts()
        await page.unrouteAll({ behavior: "wait" })
      }
      await page.waitForLoadState("load")
      if (testInfo.project.name === "desktop") {
        await expect(initialSidebar).toHaveAttribute("data-state", state)
        await expect(page.locator('[data-slot="sidebar-container"]')).toHaveCSS(
          "width",
          open ? "244px" : "64px"
        )
      } else {
        const mobile = page.locator('[data-slot="sidebar"][data-mobile="true"]')
        if (open) await expect(mobile).toBeVisible()
        else await expect(mobile).toHaveCount(0)
      }
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      )
      await expect(page.locator("html")).toHaveAttribute(
        "data-sidebar-hydration-states",
        state
      )
      expect(errors).toEqual([])
    })
  }
}

test("restores the last sidebar state after reloading and navigating between pages", async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/home")
  if (testInfo.project.name === "mobile") {
    const sidebar = page.locator('[data-slot="sidebar"][data-mobile="true"]')
    await expect(sidebar).toHaveCount(0)
    await page.getByRole("button", { name: "Open sidebar" }).click()
    await expect(sidebar).toBeVisible()
    await page.reload()
    await expect(sidebar).toBeVisible()
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
    await expect(sidebar).toHaveCount(0)
    await page.reload()
    await expect(sidebar).toHaveCount(0)
    await page.getByRole("button", { name: "Open sidebar" }).click()
    await page.getByRole("button", { name: "Open profile menu" }).click()
    await page.getByRole("link", { name: "Profile", exact: true }).click()
    await expect(page).toHaveURL("/profile")
    await expect(sidebar).toHaveCount(0)
    await page.reload()
    await expect(sidebar).toHaveCount(0)
    await page.getByRole("button", { name: "Open sidebar" }).click()
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Overview" })
      .click()
    await expect(page).toHaveURL("/home")
    await expect(sidebar).toHaveCount(0)
    await page.reload()
    await expect(sidebar).toHaveCount(0)
  } else {
    const sidebar = page.locator('[data-slot="sidebar-container"]')
    await expect(sidebar).toHaveCSS("width", "244px")
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
    await expect(sidebar).toHaveCSS("width", "64px")
    await page.reload()
    await expect(sidebar).toHaveCSS("width", "64px")
    await page.getByRole("button", { name: "Open profile menu" }).click()
    await page.getByRole("link", { name: "Profile", exact: true }).click()
    await expect(page).toHaveURL("/profile")
    await expect(sidebar).toHaveCSS("width", "64px")
    await page.reload()
    await expect(sidebar).toHaveCSS("width", "64px")
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
    await expect(sidebar).toHaveCSS("width", "244px")
    await page.reload()
    await expect(sidebar).toHaveCSS("width", "244px")
  }
  expect(errors).toEqual([])
})

test("keeps cached desktop and mobile preferences independent", async ({
  context,
  page,
}, testInfo) => {
  await context.addCookies([
    { name: "sidebar_state", value: "false", url: "http://127.0.0.1:3100" },
    {
      name: "sidebar_mobile_state",
      value: "true",
      url: "http://127.0.0.1:3100",
    },
  ])
  await page.goto("/home")
  if (testInfo.project.name === "mobile") {
    const sidebar = page.locator('[data-slot="sidebar"][data-mobile="true"]')
    await expect(sidebar).toBeVisible()
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
    await page.reload()
    await expect(sidebar).toHaveCount(0)
    expect(
      (await context.cookies()).find(
        (cookie) => cookie.name === "sidebar_state"
      )?.value
    ).toBe("false")
  } else {
    const sidebar = page.locator('[data-slot="sidebar-container"]')
    await expect(sidebar).toHaveCSS("width", "64px")
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
    await page.reload()
    await expect(sidebar).toHaveCSS("width", "244px")
    await page.getByRole("button", { name: "Open profile menu" }).click()
    await page.getByRole("link", { name: "Profile", exact: true }).click()
    await expect(page).toHaveURL("/profile")
    expect(
      (await context.cookies()).find(
        (cookie) => cookie.name === "sidebar_mobile_state"
      )?.value
    ).toBe("true")
  }
})
