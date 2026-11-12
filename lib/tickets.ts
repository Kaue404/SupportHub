export const statuses = ["Open", "In progress", "Resolved"] as const
export const priorities = ["Low", "Medium", "High", "Urgent"] as const
export type Ticket = {
  id: string
  subject: string
  description: string
  requester: string
  status: (typeof statuses)[number]
  priority: (typeof priorities)[number]
  createdAt: string
}

export const initialTickets: Ticket[] = [
  [
    "1048",
    "Unable to access my account",
    "The sign-in page keeps returning an error. Could you help me regain access?",
    "Olivia Martin",
    "Open",
    "Urgent",
  ],
  [
    "1047",
    "Monthly report is not loading",
    "The monthly report stays on the loading screen when I open it.",
    "James Wilson",
    "In progress",
    "High",
  ],
  [
    "1046",
    "Update billing information",
    "I need to update the billing address on our account.",
    "Emma Davis",
    "Open",
    "Medium",
  ],
  [
    "1045",
    "Email notifications not received",
    "I have not received any ticket updates by email this week.",
    "Noah Williams",
    "In progress",
    "High",
  ],
  [
    "1044",
    "Invite a new team member",
    "How can I invite a new colleague to our workspace?",
    "Sophia Brown",
    "Open",
    "Low",
  ],
  [
    "1043",
    "Export data to CSV",
    "I would like to export our ticket history to a CSV file.",
    "Liam Johnson",
    "Resolved",
    "Medium",
  ],
  [
    "1042",
    "Change workspace name",
    "Please help me rename our workspace.",
    "Ava Garcia",
    "Open",
    "Low",
  ],
  [
    "1041",
    "Payment was charged twice",
    "There are two charges for our latest subscription renewal.",
    "Oliver Miller",
    "In progress",
    "Urgent",
  ],
  [
    "1040",
    "Reset two-factor authentication",
    "I have a new phone and need to reset my authentication settings.",
    "Isabella Moore",
    "Resolved",
    "High",
  ],
  [
    "1039",
    "Add a custom email signature",
    "Can I add a signature to my support replies?",
    "Lucas Taylor",
    "Open",
    "Low",
  ],
  [
    "1038",
    "Dashboard displays outdated data",
    "The dashboard numbers do not match the latest report.",
    "Mia Anderson",
    "In progress",
    "Medium",
  ],
  [
    "1037",
    "Download previous invoices",
    "Where can I find invoices from previous months?",
    "Ethan Thomas",
    "Resolved",
    "Low",
  ],
].map(([id, subject, description, requester, status, priority], index) => ({
  id: `SH-${id}`,
  subject,
  description,
  requester,
  status: status as Ticket["status"],
  priority: priority as Ticket["priority"],
  createdAt: new Date(Date.UTC(2026, 10, 11 - index, 10, 30)).toISOString(),
}))

export function parseTickets(value: string | null): Ticket[] {
  if (!value) return initialTickets
  try {
    const parsed: unknown = JSON.parse(value)
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (ticket) =>
          ticket &&
          typeof ticket.id === "string" &&
          typeof ticket.subject === "string" &&
          typeof ticket.description === "string" &&
          typeof ticket.requester === "string" &&
          statuses.includes(ticket.status) &&
          priorities.includes(ticket.priority) &&
          typeof ticket.createdAt === "string" &&
          Number.isFinite(Date.parse(ticket.createdAt))
      )
    )
      return parsed
  } catch {}
  return initialTickets
}
