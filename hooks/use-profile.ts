"use client"

import { useMemo, useSyncExternalStore } from "react"
import { parseProfile, profileStorageKey, type Profile } from "@/lib/profile"

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener("profile-updated", callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener("profile-updated", callback)
  }
}

function snapshot() {
  try {
    return localStorage.getItem(profileStorageKey)
  } catch {
    return null
  }
}

const serverSnapshot = () => null

export function useProfile() {
  const stored = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  return useMemo(() => parseProfile(stored), [stored])
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(profileStorageKey, JSON.stringify(profile))
  window.dispatchEvent(new Event("profile-updated"))
}
