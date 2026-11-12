import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserAvatar({ name, photo }: { name: string; photo?: string }) {
  return (
    <Avatar className="avatar" aria-hidden={!photo || undefined}>
      {photo && <AvatarImage src={photo} alt={`Profile photo for ${name}`} />}
      <AvatarFallback>
        {name
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </AvatarFallback>
    </Avatar>
  )
}
