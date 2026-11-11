"use client"

import { useRef, useState, type FormEvent } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type FormMode = "login" | "register" | "recovery"

const content = {
  login: {
    title: "Welcome back",
    action: "Sign in",
  },
  register: {
    eyebrow: "READY TO GET STARTED?",
    title: "Create your account",
    description: "Better support starts with you.",
    action: "Create account",
  },
  recovery: {
    eyebrow: "WE ARE HERE TO HELP",
    title: "Forgot your password?",
    description: "Enter your email to reset your password.",
    action: "Reset password",
  },
}

export function AuthForm() {
  const [mode, setMode] = useState<FormMode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const headingRef = useRef<HTMLHeadingElement>(null)
  const current = content[mode]

  function changeMode(nextMode: FormMode) {
    setMode(nextMode)
    setError("")
    setMessage("")
    setShowPassword(false)
    setShowConfirmation(false)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    const data = new FormData(event.currentTarget)
    if (
      mode === "register" &&
      data.get("password") !== data.get("confirmPassword")
    ) {
      setError("Passwords do not match.")
      event.currentTarget
        .querySelector<HTMLInputElement>("#confirm-password")
        ?.focus()
      return
    }
    const messages = {
      login: "Demo: account access is unavailable.",
      register: "Demo: no account is created.",
      recovery: "Demo: no recovery email was sent.",
    }
    setMessage(messages[mode])
  }

  return (
    <div className="auth-form-content">
      <h2 ref={headingRef} tabIndex={-1}>
        {current.title}
        {mode !== "recovery" && <span>.</span>}
      </h2>
      <form key={mode} onSubmit={handleSubmit} className="auth-form">
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <div className="field-input">
            <Mail size={18} aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              required
            />
          </div>
        </div>
        {mode !== "recovery" && (
          <div className="field-group">
            <div className="field-label">
              <label htmlFor="password">Password</label>
              {mode === "login" && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => changeMode("recovery")}
                >
                  Forgot your password?
                </button>
              )}
            </div>
            <div className="field-input">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder={
                  mode === "login" ? "Enter your password" : "Create a password"
                }
                minLength={mode === "register" ? 8 : undefined}
                required
                aria-describedby={
                  mode === "register" ? "password-hint" : undefined
                }
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === "register" && (
              <p id="password-hint" className="field-hint">
                Use at least 8 characters.
              </p>
            )}
          </div>
        )}
        {mode === "register" && (
          <div className="field-group">
            <label htmlFor="confirm-password">Confirm password</label>
            <div className={`field-input ${error ? "field-invalid" : ""}`}>
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                minLength={8}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "form-error" : undefined}
                onChange={() => {
                  setError("")
                  setMessage("")
                }}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={
                  showConfirmation
                    ? "Hide password confirmation"
                    : "Show password confirmation"
                }
                aria-pressed={showConfirmation}
                onClick={() => setShowConfirmation(!showConfirmation)}
              >
                {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}
        {error && (
          <p id="form-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <div className="form-message" role="status">
            <CircleCheck size={18} />
            <p>{message}</p>
          </div>
        )}
        <Button type="submit" className="submit-button">
          {current.action}
          <ArrowRight size={18} />
        </Button>
      </form>
      {mode === "login" ? (
        <>
          <div className="form-divider">
            <span />
            New here?
            <span />
          </div>
          <p className="form-switch">
            <button
              type="button"
              className="text-link"
              onClick={() => changeMode("register")}
            >
              Create your account <ArrowRight size={14} />
            </button>
          </p>
        </>
      ) : (
        <>
          <div className="form-divider">
            <span />
            Already have an account?
            <span />
          </div>
          <button
            type="button"
            className="back-link"
            onClick={() => changeMode("login")}
          >
            <ArrowLeft size={16} />
            Back to sign in
          </button>
        </>
      )}
      <div className="form-assurance">
        <LockKeyhole size={13} />
      </div>
    </div>
  )
}
