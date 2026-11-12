"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { LogOut, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSidebar } from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/user-avatar"
import { useProfile } from "@/hooks/use-profile"

export function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const profile = useProfile()
  const profileLink = useRef<HTMLAnchorElement>(null)
  const { isMobile, setOpenMobile } = useSidebar()

  function close() {
    setOpen(false)
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="workspace-profile-trigger"
          aria-label="Open profile menu"
        >
          <UserAvatar name={profile.name} photo={profile.photo} />
          <span className="profile-details">
            <strong>{profile.name}</strong>
            <small>{profile.workspace}</small>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        collisionPadding={16}
        className="profile-popover"
        aria-label="Profile menu"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          profileLink.current?.focus()
        }}
      >
        <Button asChild variant="ghost" className="profile-menu-action">
          <Link ref={profileLink} href="/profile" onClick={close}>
            <UserRound size={16} aria-hidden="true" />
            Profile
          </Link>
        </Button>
        <Button asChild variant="ghost" className="profile-menu-action">
          <Link href="/" replace onClick={close}>
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  )
}
