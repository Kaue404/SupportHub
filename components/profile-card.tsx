"use client"

import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Camera, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/user-avatar"
import { saveProfile, useProfile } from "@/hooks/use-profile"
import { maxPhotoSize, photoTypes, type Profile } from "@/lib/profile"

function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () =>
      reject(new Error("This photo could not be read. Try another image."))
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("This photo could not be read. Try another image."))
        return
      }
      const photo = reader.result
      const image = new Image()
      image.onload = () => resolve(photo)
      image.onerror = () =>
        reject(new Error("Choose a valid JPG, PNG or WebP image."))
      image.src = photo
    }
    reader.readAsDataURL(file)
  })
}

export function ProfileCard() {
  const profile = useProfile()
  const [draft, setDraft] = useState<Profile | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [uploading, setUploading] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)
  const values = draft ?? profile
  const changed = (Object.keys(profile) as (keyof Profile)[]).some(
    (key) => values[key] !== profile[key]
  )

  function change(changes: Partial<Profile>) {
    setDraft((current) => ({ ...(current ?? profile), ...changes }))
    setError("")
    setNotice("")
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (!file) return
    setNotice("")
    if (!photoTypes.includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.")
      return
    }
    if (file.size > maxPhotoSize) {
      setError("Choose an image smaller than 2 MB.")
      return
    }
    setUploading(true)
    setError("")
    try {
      change({ photo: await readPhoto(file) })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This photo could not be read. Try another image."
      )
    } finally {
      setUploading(false)
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = {
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
      workspace: values.workspace.trim(),
    }
    const invalidField = !next.name
      ? "name"
      : !next.workspace
        ? "workspace"
        : null
    if (invalidField) {
      setError(
        invalidField === "name" ? "Enter your name." : "Enter a workspace name."
      )
      const input = event.currentTarget.elements.namedItem(invalidField)
      if (input instanceof HTMLInputElement) input.focus()
      return
    }
    try {
      saveProfile(next)
      setDraft(null)
      setError("")
      setNotice("Profile saved.")
    } catch {
      setError(
        "Your profile could not be saved. Check browser storage and try again."
      )
      setNotice("")
    }
  }

  return (
    <Card role="region" className="profile-card" aria-label="Profile details">
      <form className="profile-form" aria-label="Edit profile" onSubmit={save}>
        <CardContent className="profile-fields">
          <div className="profile-photo" aria-busy={uploading}>
            <UserAvatar
              name={values.name || profile.name}
              photo={values.photo}
            />
            <div className="profile-photo-controls">
              <div className="profile-photo-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => photoInput.current?.click()}
                >
                  <Camera size={16} aria-hidden="true" />
                  {uploading ? "Reading photo…" : "Change photo"}
                </Button>
                {values.photo && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={uploading}
                    onClick={() => change({ photo: "" })}
                  >
                    Remove photo
                  </Button>
                )}
              </div>
              <FieldDescription id="profile-photo-hint">
                JPG, PNG or WebP. Up to 2 MB.
              </FieldDescription>
              <input
                ref={photoInput}
                id="profile-photo"
                className="sr-only"
                type="file"
                accept={photoTypes.join(",")}
                aria-label="Photo"
                aria-describedby="profile-photo-hint"
                tabIndex={-1}
                onChange={uploadPhoto}
                disabled={uploading}
              />
            </div>
          </div>
          <Field>
            <FieldLabel htmlFor="profile-name">Name</FieldLabel>
            <Input
              id="profile-name"
              name="name"
              value={values.name}
              autoComplete="name"
              required
              maxLength={120}
              aria-invalid={!!error && !values.name.trim()}
              aria-describedby={
                error && !values.name.trim() ? "profile-error" : undefined
              }
              onChange={(event) => change({ name: event.target.value })}
            />
          </Field>
          <Field className="profile-description">
            <FieldLabel htmlFor="profile-description">Description</FieldLabel>
            <Textarea
              id="profile-description"
              name="description"
              value={values.description}
              rows={4}
              maxLength={500}
              placeholder="Tell your team about yourself"
              onChange={(event) => change({ description: event.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-workspace">Workspace</FieldLabel>
            <Input
              id="profile-workspace"
              name="workspace"
              value={values.workspace}
              autoComplete="organization"
              required
              maxLength={120}
              aria-invalid={!!error && !values.workspace.trim()}
              aria-describedby={
                error && !values.workspace.trim() ? "profile-error" : undefined
              }
              onChange={(event) => change({ workspace: event.target.value })}
            />
          </Field>
          {error && <FieldError id="profile-error">{error}</FieldError>}
          {notice && (
            <p className="profile-notice" role="status">
              <CircleCheck size={16} aria-hidden="true" />
              {notice}
            </p>
          )}
        </CardContent>
        <CardFooter
          className="profile-actions"
          role="group"
          aria-label="Profile actions"
        >
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => {
              setDraft(null)
              setError("")
              setNotice("")
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!changed || uploading}>
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
