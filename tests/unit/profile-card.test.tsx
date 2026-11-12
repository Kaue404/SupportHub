import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, expect, it, vi } from "vitest"
import ProfilePage from "@/app/profile/page"
import {
  defaultProfile,
  maxPhotoSize,
  parseProfile,
  profileStorageKey,
} from "@/lib/profile"

beforeEach(() => localStorage.clear())

it("keeps cancel and save actions in the card footer inside the editable form", () => {
  render(<ProfilePage />)
  const form = screen.getByRole("form", { name: "Edit profile" })
  const actions = within(form).getByRole("group", { name: "Profile actions" })
  expect(
    within(actions)
      .getAllByRole("button")
      .map((button) => button.textContent)
  ).toEqual(["Cancel", "Save changes"])
  expect(
    within(actions).getByRole("button", { name: "Cancel" })
  ).toHaveAttribute("type", "button")
  expect(
    within(actions).getByRole("button", { name: "Save changes" })
  ).toHaveAttribute("type", "submit")
})

it("saves all text fields, trims their values and updates the sidebar immediately", async () => {
  const user = userEvent.setup()
  const { unmount } = render(<ProfilePage />)
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  await user.clear(screen.getByLabelText("Name"))
  await user.type(screen.getByLabelText("Name"), "  Alex Morgan  ")
  await user.type(
    screen.getByLabelText("Description"),
    "  Support specialist  "
  )
  await user.clear(screen.getByLabelText("Workspace"))
  await user.type(screen.getByLabelText("Workspace"), "  Customer care  ")
  expect(
    screen.getByRole("button", { name: "Open profile menu" })
  ).toHaveTextContent("Support workspace")
  await user.click(screen.getByRole("button", { name: "Save changes" }))
  expect(screen.getByRole("status")).toHaveTextContent("Profile saved.")
  expect(parseProfile(localStorage.getItem(profileStorageKey))).toEqual({
    name: "Alex Morgan",
    description: "Support specialist",
    workspace: "Customer care",
    photo: "",
  })
  const trigger = screen.getByRole("button", { name: "Open profile menu" })
  expect(trigger).toHaveTextContent("Alex Morgan")
  expect(trigger).toHaveTextContent("Customer care")
  unmount()
  render(<ProfilePage />)
  expect(screen.getByLabelText("Name")).toHaveValue("Alex Morgan")
  expect(screen.getByLabelText("Description")).toHaveValue("Support specialist")
  expect(screen.getByLabelText("Workspace")).toHaveValue("Customer care")
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
})

it("cancels unsaved edits without changing the stored profile or sidebar", async () => {
  const user = userEvent.setup()
  render(<ProfilePage />)
  await user.clear(screen.getByLabelText("Name"))
  await user.type(screen.getByLabelText("Name"), "Unsaved name")
  await user.type(screen.getByLabelText("Description"), "Unsaved description")
  await user.clear(screen.getByLabelText("Workspace"))
  await user.type(screen.getByLabelText("Workspace"), "Unsaved workspace")
  await user.click(screen.getByRole("button", { name: "Cancel" }))
  expect(screen.getByLabelText("Name")).toHaveValue(defaultProfile.name)
  expect(screen.getByLabelText("Description")).toHaveValue("")
  expect(screen.getByLabelText("Workspace")).toHaveValue(
    defaultProfile.workspace
  )
  expect(localStorage.getItem(profileStorageKey)).toBeNull()
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
})

it.each([
  ["Name", "Enter your name."],
  ["Workspace", "Enter a workspace name."],
])(
  "rejects a blank %s and focuses the invalid field",
  async (label, message) => {
    const user = userEvent.setup()
    render(<ProfilePage />)
    await user.clear(screen.getByLabelText(label))
    await user.type(screen.getByLabelText(label), "   ")
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    expect(screen.getByRole("alert")).toHaveTextContent(message)
    expect(screen.getByLabelText(label)).toHaveFocus()
    expect(screen.getByLabelText(label)).toHaveAttribute("aria-invalid", "true")
    expect(localStorage.getItem(profileStorageKey)).toBeNull()
  }
)

it("reports storage failures and keeps the saved sidebar unchanged", async () => {
  const user = userEvent.setup()
  render(<ProfilePage />)
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage full")
  })
  await user.clear(screen.getByLabelText("Name"))
  await user.type(screen.getByLabelText("Name"), "Alex Morgan")
  await user.click(screen.getByRole("button", { name: "Save changes" }))
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Your profile could not be saved."
  )
  expect(screen.getByLabelText("Name")).toHaveValue("Alex Morgan")
  expect(
    screen.getByRole("button", { name: "Open profile menu" })
  ).toHaveTextContent(defaultProfile.name)
  expect(localStorage.getItem(profileStorageKey)).toBeNull()
})

it.each([
  "not json",
  JSON.stringify({ ...defaultProfile, name: "   " }),
  JSON.stringify({ ...defaultProfile, photo: "https://example.com/photo.png" }),
])(
  "falls back to editable default values for invalid stored data: %s",
  (stored) => {
    localStorage.setItem(profileStorageKey, stored)
    render(<ProfilePage />)
    expect(screen.getByLabelText("Name")).toHaveValue(defaultProfile.name)
    expect(screen.getByLabelText("Workspace")).toHaveValue(
      defaultProfile.workspace
    )
    expect(screen.getByLabelText("Name")).toBeEnabled()
  }
)

it("refreshes the card and sidebar when the saved profile changes in another tab", () => {
  render(<ProfilePage />)
  act(() => {
    localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        ...defaultProfile,
        name: "Alex Morgan",
        workspace: "Customer care",
      })
    )
    window.dispatchEvent(new Event("storage"))
  })
  expect(screen.getByLabelText("Name")).toHaveValue("Alex Morgan")
  expect(screen.getByLabelText("Workspace")).toHaveValue("Customer care")
  expect(
    screen.getByRole("button", { name: "Open profile menu" })
  ).toHaveTextContent("Alex Morgan")
})

it.each([
  [
    new File(["text"], "notes.txt", { type: "text/plain" }),
    "Choose a JPG, PNG or WebP image.",
  ],
  [
    new File([new Uint8Array(maxPhotoSize + 1)], "large.png", {
      type: "image/png",
    }),
    "Choose an image smaller than 2 MB.",
  ],
])(
  "rejects an unsupported or oversized photo without changing the profile",
  async (file, message) => {
    const user = userEvent.setup({ applyAccept: false })
    render(<ProfilePage />)
    await user.upload(screen.getByLabelText("Photo", { exact: true }), file)
    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
    expect(localStorage.getItem(profileStorageKey)).toBeNull()
  }
)

it("previews, saves, cancels removal and removes a profile photo", async () => {
  vi.spyOn(window, "Image").mockImplementation(function () {
    const image = document.createElement("img")
    Object.defineProperties(image, {
      complete: { value: true },
      naturalWidth: { value: 48 },
    })
    queueMicrotask(() => image.dispatchEvent(new Event("load")))
    return image
  })
  const user = userEvent.setup()
  render(<ProfilePage />)
  await user.upload(
    screen.getByLabelText("Photo", { exact: true }),
    new File(["image bytes"], "photo.png", { type: "image/png" })
  )
  const card = screen.getByRole("region", { name: "Profile details" })
  expect(
    await within(card).findByRole("img", {
      name: `Profile photo for ${defaultProfile.name}`,
    })
  ).toBeVisible()
  expect(localStorage.getItem(profileStorageKey)).toBeNull()
  await user.click(screen.getByRole("button", { name: "Save changes" }))
  const photo = parseProfile(localStorage.getItem(profileStorageKey)).photo
  expect(photo).toMatch(/^data:image\/png;base64,/)
  await user.click(screen.getByRole("button", { name: "Remove photo" }))
  await user.click(screen.getByRole("button", { name: "Cancel" }))
  expect(screen.getByRole("button", { name: "Remove photo" })).toBeVisible()
  await user.click(screen.getByRole("button", { name: "Remove photo" }))
  await user.click(screen.getByRole("button", { name: "Save changes" }))
  expect(parseProfile(localStorage.getItem(profileStorageKey)).photo).toBe("")
  expect(within(card).queryByRole("img")).not.toBeInTheDocument()
})

it("reports a file read failure without saving a photo", async () => {
  vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (
    this: FileReader
  ) {
    this.dispatchEvent(new ProgressEvent("error"))
  })
  const user = userEvent.setup()
  render(<ProfilePage />)
  await user.upload(
    screen.getByLabelText("Photo", { exact: true }),
    new File(["image"], "photo.png", { type: "image/png" })
  )
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This photo could not be read."
  )
  expect(localStorage.getItem(profileStorageKey)).toBeNull()
})
