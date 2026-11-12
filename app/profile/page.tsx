import { ProfileCard } from "@/components/profile-card"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function ProfilePage() {
  return (
    <WorkspaceShell page="Profile">
      <main className="dashboard-content profile-content" aria-label="Profile">
        <ProfileCard />
      </main>
    </WorkspaceShell>
  )
}
