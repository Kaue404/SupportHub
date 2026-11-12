import { expect, test, type Page } from "@playwright/test"

async function openSidebar(page: Page) {
  const open = page.getByRole("button", { name: "Open sidebar" })
  if (await open.isVisible()) await open.click()
}

test("edits and saves names safely when keyboard events omit their key", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.addInitScript(() => localStorage.setItem("theme", "light"))
  await page.goto("/profile")
  const name = page.getByRole("textbox", { name: "Name", exact: true })
  await name.fill("")
  await name.evaluate((element) =>
    element.dispatchEvent(new Event("keydown", { bubbles: true }))
  )
  await name.pressSequentially("Diana Reed")
  await expect(name).toHaveValue("Diana Reed")
  await expect(page.locator("html")).toHaveClass(/light/)
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByRole("status")).toHaveText("Profile saved.")
  await page.reload()
  await expect(name).toHaveValue("Diana Reed")
  await page.evaluate(() => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    window.dispatchEvent(new Event("keydown"))
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "d", isComposing: true })
    )
  })
  await expect(page.locator("html")).toHaveClass(/light/)
  await page.keyboard.press("d")
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.keyboard.press("D")
  await expect(page.locator("html")).toHaveClass(/light/)
  expect(errors).toEqual([])
})

function borderShape(element: Element) {
  const style = getComputedStyle(element)
  return {
    widths: [
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth,
    ],
    styles: [
      style.borderTopStyle,
      style.borderRightStyle,
      style.borderBottomStyle,
      style.borderLeftStyle,
    ],
    colors: [
      style.borderTopColor,
      style.borderRightColor,
      style.borderBottomColor,
      style.borderLeftColor,
    ],
    radii: [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius,
    ],
  }
}

async function overviewEdges(page: Page) {
  await page.goto("/home")
  const [main, cards, panelShape, panelShadow, controlShape, buttonShape] =
    await Promise.all([
      page.getByRole("main").boundingBox(),
      page.getByRole("region", { name: "Ticket overview" }).boundingBox(),
      page.getByRole("region", { name: /^All tickets/ }).evaluate(borderShape),
      page
        .getByRole("region", { name: /^All tickets/ })
        .evaluate((element) => getComputedStyle(element).boxShadow),
      page
        .getByRole("combobox", { name: "Filter by status" })
        .evaluate(borderShape),
      page.getByRole("button", { name: "New ticket" }).evaluate(borderShape),
    ])
  return { main, cards, panelShape, panelShadow, controlShape, buttonShape }
}

async function expectProfileLayout(
  page: Page,
  overview: Awaited<ReturnType<typeof overviewEdges>>
) {
  const card = page.getByRole("region", { name: "Profile details" })
  expect(await card.evaluate(borderShape)).toEqual(overview.panelShape)
  await expect(card).toHaveCSS("box-shadow", overview.panelShadow)
  const [
    mainBounds,
    cardBounds,
    dividerBounds,
    footerBounds,
    saveBounds,
    cancelBounds,
  ] = await Promise.all([
    page.getByRole("main", { name: "Profile" }).boundingBox(),
    card.boundingBox(),
    page.locator(".hub-topbar").boundingBox(),
    card.getByRole("group", { name: "Profile actions" }).boundingBox(),
    card.getByRole("button", { name: "Save changes" }).boundingBox(),
    card.getByRole("button", { name: "Cancel" }).boundingBox(),
  ])
  expect(cardBounds!.y - dividerBounds!.y - dividerBounds!.height).toBeCloseTo(
    64,
    1
  )
  expect(mainBounds!.x).toBeCloseTo(overview.main!.x, 1)
  expect(mainBounds!.width).toBeCloseTo(overview.main!.width, 1)
  expect(cardBounds!.x).toBeCloseTo(overview.cards!.x, 1)
  expect(cardBounds!.width).toBeCloseTo(overview.cards!.width, 1)
  expect(
    mainBounds!.y + mainBounds!.height - cardBounds!.y - cardBounds!.height
  ).toBeCloseTo(64, 1)
  for (const name of ["Name", "Description", "Workspace"]) {
    expect(
      await card
        .getByRole("textbox", { name, exact: true })
        .evaluate(borderShape)
    ).toEqual(overview.controlShape)
    const bounds = await card
      .getByRole("textbox", { name, exact: true })
      .boundingBox()
    expect(bounds!.x - cardBounds!.x).toBeCloseTo(25, 1)
    expect(
      cardBounds!.x + cardBounds!.width - bounds!.x - bounds!.width
    ).toBeCloseTo(25, 1)
  }
  expect(footerBounds!.y + footerBounds!.height).toBeCloseTo(
    cardBounds!.y + cardBounds!.height - 1,
    1
  )
  expect(saveBounds!.x + saveBounds!.width).toBeCloseTo(
    cardBounds!.x + cardBounds!.width - 25,
    1
  )
  expect(saveBounds!.y + saveBounds!.height).toBeCloseTo(
    cardBounds!.y + cardBounds!.height - 17,
    1
  )
  expect(cancelBounds!.y).toBeCloseTo(saveBounds!.y, 1)
  expect(cancelBounds!.x + cancelBounds!.width).toBeLessThan(saveBounds!.x)
  for (const name of ["Cancel", "Save changes"]) {
    const shape = await card
      .getByRole("button", { name, exact: true })
      .evaluate(borderShape)
    expect(shape.widths).toEqual(overview.buttonShape.widths)
    expect(shape.radii).toEqual(overview.buttonShape.radii)
  }
  const description = card.getByRole("textbox", {
    name: "Description",
    exact: true,
  })
  await expect(description).toHaveCSS("resize", "none")
  await expect(description).toHaveCSS("field-sizing", "fixed")
  return (await description.boundingBox())!.height
}

for (const theme of ["light", "dark"]) {
  test(`fills the profile card and keeps actions in its lower-right footer in ${theme} theme`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme
    )
    let overview = await overviewEdges(page)
    await page.goto("/profile")
    const initialHeight = await expectProfileLayout(page, overview)
    if (testInfo.project.name === "desktop") {
      await page.setViewportSize({ width: 1920, height: 1080 })
      overview = await overviewEdges(page)
      await page.goto("/profile")
      const expandedHeight = await expectProfileLayout(page, overview)
      expect(expandedHeight - initialHeight).toBeGreaterThan(300)
    }
    const description = page.getByRole("textbox", {
      name: "Description",
      exact: true,
    })
    const before = await description.boundingBox()
    await description.fill("Line\n".repeat(100))
    expect((await description.boundingBox())!.height).toBeCloseTo(
      before!.height,
      1
    )
    expect(
      await description.evaluate(
        (element) => element.scrollHeight > element.clientHeight
      )
    ).toBe(true)
    await expectProfileLayout(page, overview)
    await description.fill("A short introduction for the support team.")
    await page.screenshot({
      path: testInfo.outputPath(`profile-layout-${theme}.png`),
      animations: "disabled",
      fullPage: true,
    })
  })
}

test("opens the profile popover, dismisses it and keeps it inside the viewport", async ({
  page,
}, testInfo) => {
  await page.goto("/home")
  await openSidebar(page)
  const trigger = page.getByRole("button", { name: "Open profile menu" })
  await trigger.click()
  const popover = page.getByRole("dialog", { name: "Profile menu" })
  await expect(popover).toBeInViewport({ ratio: 1 })
  await expect(
    popover.getByRole("link", { name: "Profile", exact: true })
  ).toBeFocused()
  await expect(popover.getByRole("link", { name: "Sign out" })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath("profile-popover.png"),
    animations: "disabled",
    fullPage: true,
  })
  await page.keyboard.press("Escape")
  await expect(popover).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page.getByText("WORKSPACE", { exact: true }).click()
  await expect(popover).toHaveCount(0)
  await expect(trigger).toBeVisible()
})

test("opens the profile menu by keyboard from a collapsed or mobile sidebar", async ({
  page,
}, testInfo) => {
  await page.goto("/home")
  await openSidebar(page)
  if (testInfo.project.name === "desktop") {
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
  }
  const trigger = page.getByRole("button", { name: "Open profile menu" })
  await trigger.focus()
  await page.keyboard.press("Enter")
  const popover = page.getByRole("dialog", { name: "Profile menu" })
  await expect(popover).toBeInViewport({ ratio: 1 })
  await expect(
    popover.getByRole("link", { name: "Profile", exact: true })
  ).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(popover.getByRole("link", { name: "Sign out" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
})

test("navigates to the profile, returns to overview and signs out to the access page", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"))
  await page.goto("/home")
  await expect(
    page.getByRole("navigation", { name: "Page navigation" })
  ).toHaveText("WorkspaceOverview")
  await openSidebar(page)
  await page.getByRole("button", { name: "Open profile menu" }).click()
  await page.getByRole("link", { name: "Profile", exact: true }).click()
  await expect(page).toHaveURL("/profile")
  await expect(page.getByRole("main", { name: "Profile" })).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Profile", level: 1 })
  ).toHaveCount(0)
  await expect(
    page.getByRole("textbox", { name: "Workspace", exact: true })
  ).toHaveValue("Demo workspace")
  const cardBounds = await page
    .getByRole("region", { name: "Profile details" })
    .boundingBox()
  const dividerBounds = await page.locator(".hub-topbar").boundingBox()
  expect(cardBounds!.y - dividerBounds!.y - dividerBounds!.height).toBe(64)
  await expect(page.getByRole("dialog")).toHaveCount(0)
  const breadcrumb = page.getByRole("navigation", { name: "Page navigation" })
  await expect(breadcrumb).toHaveText("Profile")
  await expect(breadcrumb.getByRole("listitem")).toHaveCount(1)
  await expect(
    breadcrumb.getByRole("link", { name: "Profile" })
  ).toHaveAttribute("aria-current", "page")
  await page.screenshot({
    path: testInfo.outputPath("profile-page.png"),
    animations: "disabled",
    fullPage: true,
  })
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Profile", level: 1 })
  ).toHaveCount(0)
  await expect(breadcrumb).toHaveText("Profile")
  await openSidebar(page)
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Overview", exact: true })
    .click()
  await expect(page).toHaveURL("/home")
  await expect(
    page.getByRole("navigation", { name: "Page navigation" })
  ).toHaveText("WorkspaceOverview")
  await openSidebar(page)
  await page.getByRole("button", { name: "Open profile menu" }).click()
  await page.getByRole("link", { name: "Sign out" }).click()
  await expect(page).toHaveURL("/")
  await expect(
    page.getByRole("heading", { name: "Welcome back." })
  ).toBeVisible()
  await expect(page.locator("html")).toHaveClass(/dark/)
})

test("edits the profile directly in the card, persists every field and updates the sidebar", async ({
  page,
}, testInfo) => {
  await page.goto("/profile")
  const card = page.getByRole("region", { name: "Profile details" })
  await card
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Alex Morgan")
  await card
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Support specialist")
  await card
    .getByRole("textbox", { name: "Workspace", exact: true })
    .fill("Customer care")
  const photo = await page.evaluate(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 48
    canvas.height = 48
    const context = canvas.getContext("2d")!
    context.fillStyle = getComputedStyle(document.body).getPropertyValue(
      "--primary"
    )
    context.fillRect(0, 0, 48, 48)
    return canvas.toDataURL("image/png").split(",")[1]
  })
  await card.getByLabel("Photo", { exact: true }).setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from(photo, "base64"),
  })
  await expect(
    card.getByRole("img", { name: "Profile photo for Alex Morgan" })
  ).toBeVisible()
  await card.getByRole("button", { name: "Save changes" }).click()
  await expect(card.getByRole("status")).toHaveText("Profile saved.")
  await openSidebar(page)
  const trigger = page.getByRole("button", { name: "Open profile menu" })
  await expect(trigger).toContainText("Alex Morgan")
  await expect(trigger).toContainText("Customer care")
  await expect(
    trigger.getByRole("img", { name: "Profile photo for Alex Morgan" })
  ).toBeVisible()
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Toggle sidebar" }).click()
  }
  await card
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Unsaved name")
  await card
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Unsaved description")
  await card
    .getByRole("textbox", { name: "Workspace", exact: true })
    .fill("Unsaved workspace")
  await card.getByRole("button", { name: "Remove photo" }).click()
  await card.getByRole("button", { name: "Cancel" }).click()
  await expect(
    card.getByRole("textbox", { name: "Name", exact: true })
  ).toHaveValue("Alex Morgan")
  await expect(
    card.getByRole("textbox", { name: "Description", exact: true })
  ).toHaveValue("Support specialist")
  await expect(
    card.getByRole("textbox", { name: "Workspace", exact: true })
  ).toHaveValue("Customer care")
  await expect(
    card.getByRole("img", { name: "Profile photo for Alex Morgan" })
  ).toBeVisible()
  await expect(
    card.getByRole("button", { name: "Save changes" })
  ).toBeDisabled()
  await page.reload()
  await expect(
    card.getByRole("textbox", { name: "Name", exact: true })
  ).toHaveValue("Alex Morgan")
  await expect(
    card.getByRole("textbox", { name: "Description", exact: true })
  ).toHaveValue("Support specialist")
  await expect(
    card.getByRole("textbox", { name: "Workspace", exact: true })
  ).toHaveValue("Customer care")
  await expect(
    card.getByRole("img", { name: "Profile photo for Alex Morgan" })
  ).toBeVisible()
  const bounds = await card.boundingBox()
  const divider = await page.locator(".hub-topbar").boundingBox()
  expect(bounds!.y - divider!.y - divider!.height).toBe(64)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath("edited-profile.png"),
    fullPage: true,
    animations: "disabled",
  })
  await page.goto("/home")
  await openSidebar(page)
  await expect(trigger).toContainText("Alex Morgan")
  await expect(trigger).toContainText("Customer care")
  await trigger.click()
  await page.getByRole("link", { name: "Profile", exact: true }).click()
  await card.getByRole("button", { name: "Remove photo" }).click()
  await card.getByRole("button", { name: "Save changes" }).click()
  await page.reload()
  await expect(card.getByRole("img")).toHaveCount(0)
  await expect(card.getByRole("button", { name: "Remove photo" })).toHaveCount(
    0
  )
  await expect(
    card.getByRole("textbox", { name: "Name", exact: true })
  ).toHaveValue("Alex Morgan")
})

test("validates profile text and rejects unsupported, oversized and corrupt photos", async ({
  page,
}) => {
  await page.goto("/profile")
  const card = page.getByRole("region", { name: "Profile details" })
  const name = card.getByRole("textbox", { name: "Name", exact: true })
  const workspace = card.getByRole("textbox", {
    name: "Workspace",
    exact: true,
  })
  await name.fill("   ")
  await card.getByRole("button", { name: "Save changes" }).click()
  await expect(card.getByRole("alert")).toHaveText("Enter your name.")
  await expect(name).toBeFocused()
  await name.fill("Alex Morgan")
  await workspace.fill("   ")
  await card.getByRole("button", { name: "Save changes" }).click()
  await expect(card.getByRole("alert")).toHaveText("Enter a workspace name.")
  await expect(workspace).toBeFocused()
  await card.getByRole("button", { name: "Cancel" }).click()
  const photo = card.getByLabel("Photo", { exact: true })
  await photo.setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a photo"),
  })
  await expect(card.getByRole("alert")).toHaveText(
    "Choose a JPG, PNG or WebP image."
  )
  await photo.setInputFiles({
    name: "large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  })
  await expect(card.getByRole("alert")).toHaveText(
    "Choose an image smaller than 2 MB."
  )
  await photo.setInputFiles({
    name: "corrupt.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  })
  await expect(card.getByRole("alert")).toHaveText(
    "Choose a valid JPG, PNG or WebP image."
  )
  await expect(
    card.getByRole("button", { name: "Save changes" })
  ).toBeDisabled()
  expect(
    await page.evaluate(() => localStorage.getItem("support-hub-profile-v1"))
  ).toBeNull()
})
