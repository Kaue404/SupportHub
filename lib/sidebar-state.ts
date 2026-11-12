export const SIDEBAR_COOKIE_NAME = "sidebar_state"
export const SIDEBAR_MOBILE_COOKIE_NAME = "sidebar_mobile_state"
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export type SidebarDefaults = {
  open: boolean
  openMobile: boolean
}

export const defaultSidebarState: SidebarDefaults = {
  open: true,
  openMobile: false,
}

export function parseSidebarCookie(value: string | undefined) {
  return value === "true" ? true : value === "false" ? false : undefined
}
