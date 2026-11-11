import Image from "next/image"
import Link from "next/link"
import { Headset } from "lucide-react"
import { AuthForm } from "@/components/auth-form"

export default function Page() {
  return (
    <main className="auth-page">
      <section className="auth-story" aria-labelledby="story-title">
        <Link href="/" className="brand" aria-label="Support Hub — home">
          <span className="brand-icon">
            <Headset size={24} strokeWidth={1.8} />
          </span>
          <span>
            Support <span className="brand-light">Hub</span>
          </span>
        </Link>
        <div className="story-content">
          <h1 id="story-title">
            Less noise.
            <br /> More <span>solutions.</span>
          </h1>
          <p className="story-description">Organize tickets. Solve together.</p>
          <div className="story-illustration">
            <div className="illustration-glow" />
            <Image
              src="/login.svg"
              alt="Team working together to provide support"
              width={615}
              height={382}
              preload
              className="support-illustration"
            />
          </div>
        </div>
        <div className="story-footer">
          <span className="footer-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
      </section>
      <section className="auth-panel" aria-label="Support Hub access">
        <div className="form-container">
          <AuthForm />
        </div>
        <footer className="panel-footer">
          <span>© {new Date().getFullYear()} Support Hub</span>
        </footer>
      </section>
    </main>
  )
}
