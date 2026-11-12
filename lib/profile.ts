export type Profile = {
  name: string
  description: string
  workspace: string
  photo: string
}

export const profileStorageKey = "support-hub-profile-v1"
export const maxPhotoSize = 2 * 1024 * 1024
export const photoTypes = ["image/jpeg", "image/png", "image/webp"]
export const defaultProfile: Profile = {
  name: "Support workspace",
  description: "",
  workspace: "Demo workspace",
  photo: "",
}

export function parseProfile(value: string | null): Profile {
  if (!value) return defaultProfile
  try {
    const profile: unknown = JSON.parse(value)
    if (!profile || typeof profile !== "object") return defaultProfile
    const data = profile as Record<string, unknown>
    if (
      typeof data.name === "string" &&
      data.name.trim().length > 0 &&
      data.name.length <= 120 &&
      typeof data.description === "string" &&
      data.description.length <= 500 &&
      typeof data.workspace === "string" &&
      data.workspace.trim().length > 0 &&
      data.workspace.length <= 120 &&
      typeof data.photo === "string" &&
      data.photo.length <= Math.ceil(maxPhotoSize / 3) * 4 + 64 &&
      (!data.photo ||
        /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
          data.photo
        ))
    ) {
      return {
        name: data.name,
        description: data.description,
        workspace: data.workspace,
        photo: data.photo,
      }
    }
  } catch {}
  return defaultProfile
}
