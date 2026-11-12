import { act, renderHook } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import { useIsMobile } from "@/hooks/use-mobile"

it("tracks the viewport and removes the listener on unmount", () => {
  let onChange = () => {}
  const media = {
    matches: false,
    addEventListener: vi.fn((_event, callback) => {
      onChange = callback
    }),
    removeEventListener: vi.fn(),
  }
  vi.spyOn(window, "matchMedia").mockReturnValue(
    media as unknown as MediaQueryList
  )
  const { result, unmount } = renderHook(() => useIsMobile())
  expect(result.current).toBe(false)
  act(() => {
    media.matches = true
    onChange()
  })
  expect(result.current).toBe(true)
  act(() => {
    media.matches = false
    onChange()
  })
  expect(result.current).toBe(false)
  unmount()
  expect(media.removeEventListener).toHaveBeenCalledWith("change", onChange)
})
