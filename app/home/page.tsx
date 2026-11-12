import { Suspense } from "react"
import { TicketDashboard } from "@/components/ticket-dashboard"

export default function HomePage() {
  return (
    <Suspense
      fallback={<main className="dashboard-loading">Loading tickets…</main>}
    >
      <TicketDashboard />
    </Suspense>
  )
}
