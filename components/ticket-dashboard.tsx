"use client"

import {
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardFooter } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Inbox,
  Plus,
  Search,
  Ticket as TicketIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { WorkspaceShell } from "@/components/workspace-shell"
import { parseTickets, priorities, statuses, type Ticket } from "@/lib/tickets"

const storageKey = "support-hub-tickets-v1"
const pageSize = 6
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener("tickets-updated", callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener("tickets-updated", callback)
  }
}
function snapshot() {
  try {
    return localStorage.getItem(storageKey)
  } catch {
    return null
  }
}
const serverSnapshot = () => null

function TicketDialog({
  title,
  children,
  trigger,
  open,
  onOpenChange,
}: {
  title: string
  children: ReactNode
  trigger: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="ticket-dialog" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function TicketSelect({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  className,
  id,
  name,
  disabled,
}: {
  label?: string
  options: readonly string[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  name?: string
  disabled?: boolean
}) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        {placeholder && <SelectItem value="all">{placeholder}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function TicketDashboard() {
  const params = useSearchParams()
  const pathname = usePathname()
  const stored = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const tickets = useMemo(() => parseTickets(stored), [stored])
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [creating, setCreating] = useState(false)
  const query = params.get("q") ?? ""
  const status = statuses.find((value) => value === params.get("status")) ?? ""
  const priority =
    priorities.find((value) => value === params.get("priority")) ?? ""
  const filtered = tickets.filter(
    (ticket) =>
      (!status || ticket.status === status) &&
      (!priority || ticket.priority === priority) &&
      `${ticket.id} ${ticket.subject} ${ticket.requester}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const requestedPage = Number(params.get("page") || 1)
  const page = Math.min(
    pageCount,
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  )
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  function navigate(key: string, value: string) {
    const next = new URLSearchParams(window.location.search)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== "page") next.delete("page")
    const url = `${pathname}${next.size ? `?${next}` : ""}`
    if (key === "q") window.history.replaceState(null, "", url)
    else window.history.pushState(null, "", url)
  }

  function save(next: Ticket[], message: string) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      window.dispatchEvent(new Event("tickets-updated"))
      setNotice(message)
      setError("")
      return true
    } catch {
      setError(
        "Your changes could not be saved. Check browser storage and try again."
      )
      return false
    }
  }
  function update(ticket: Ticket, changes: Partial<Ticket>, message: string) {
    if (ticket.status === "Resolved") return
    save(
      tickets.map((item) =>
        item.id === ticket.id ? { ...item, ...changes } : item
      ),
      message
    )
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const subject = String(data.get("subject") ?? "").trim()
    const description = String(data.get("description") ?? "").trim()
    if (!subject || !description) {
      setError("Enter a subject and description.")
      return
    }
    const selectedPriority =
      priorities.find((value) => value === data.get("priority")) ?? "Medium"
    const ticket: Ticket = {
      id: `SH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      subject,
      description,
      priority: selectedPriority,
      requester: "You",
      status: "Open",
      createdAt: new Date().toISOString(),
    }
    if (save([ticket, ...tickets], "Ticket created.")) {
      setCreating(false)
      const next = new URLSearchParams(window.location.search)
      for (const key of ["q", "status", "priority", "page"]) next.delete(key)
      window.history.pushState(
        null,
        "",
        `${pathname}${next.size ? `?${next}` : ""}`
      )
    }
  }

  return (
    <WorkspaceShell page="Overview">
      <main className="dashboard-content">
        <h1 className="sr-only">Support overview</h1>
        <div className="dashboard-heading">
          <p>Keep track of every ticket, from first message to resolution.</p>
          <TicketDialog
            title="New ticket"
            open={creating}
            onOpenChange={(open) => {
              setCreating(open)
              setError("")
            }}
            trigger={
              <Button className="hub-primary">
                <Plus size={17} /> New ticket
              </Button>
            }
          >
            <form className="ticket-form" onSubmit={create}>
              <Field>
                <FieldLabel htmlFor="ticket-subject">Subject</FieldLabel>
                <Input
                  id="ticket-subject"
                  name="subject"
                  maxLength={120}
                  required
                  placeholder="A short summary of the issue"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ticket-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="ticket-description"
                  name="description"
                  maxLength={4000}
                  required
                  rows={5}
                  placeholder="What happened?"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ticket-priority">Priority</FieldLabel>
                <TicketSelect
                  id="ticket-priority"
                  name="priority"
                  defaultValue="Medium"
                  options={priorities}
                />
              </Field>
              {error && <FieldError className="form-error">{error}</FieldError>}
              <Button type="submit" className="hub-primary">
                Create ticket <ArrowUpRight size={16} />
              </Button>
            </form>
          </TicketDialog>
        </div>
        <section className="ticket-stats" aria-label="Ticket overview">
          {[
            {
              label: "Total tickets",
              count: tickets.length,
              icon: TicketIcon,
            },
            {
              label: "Open",
              count: tickets.filter((t) => t.status === "Open").length,
              icon: Inbox,
            },
            {
              label: "In progress",
              count: tickets.filter((t) => t.status === "In progress").length,
              icon: Clock3,
            },
            {
              label: "Resolved",
              count: tickets.filter((t) => t.status === "Resolved").length,
              icon: CircleCheck,
            },
          ].map(({ label, count, icon: Icon }) => (
            <Card className="stat-card" key={label}>
              <div>
                <span>{label}</span>
                <Icon size={18} />
              </div>
              <strong>{count.toString().padStart(2, "0")}</strong>
            </Card>
          ))}
        </section>
        {notice && (
          <p className="ticket-notice" role="status">
            <CircleCheck size={16} />
            {notice}
          </p>
        )}
        {error && !creating && (
          <FieldError className="form-error">{error}</FieldError>
        )}
        <Card
          role="region"
          className="tickets-panel"
          aria-labelledby="tickets-title"
        >
          <div className="tickets-panel-heading">
            <div>
              <h2 id="tickets-title">
                All tickets <Badge variant="outline">{tickets.length}</Badge>
              </h2>
            </div>
          </div>
          <div className="ticket-filters">
            <InputGroup className="ticket-search">
              <InputGroupAddon>
                <Search size={18} />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search tickets"
                placeholder="Search by subject, ID or requester…"
                value={query}
                onChange={(event) => navigate("q", event.target.value)}
              />
            </InputGroup>
            <TicketSelect
              label="Filter by status"
              className="ticket-filter-select"
              options={statuses}
              value={status || "all"}
              onValueChange={(value) =>
                navigate("status", value === "all" ? "" : value)
              }
              placeholder="All statuses"
            />
            <TicketSelect
              label="Filter by priority"
              className="ticket-filter-select"
              options={priorities}
              value={priority || "all"}
              onValueChange={(value) =>
                navigate("priority", value === "all" ? "" : value)
              }
              placeholder="All priorities"
            />
            {(query || status || priority) && (
              <Button
                variant="ghost"
                onClick={() => {
                  const next = new URLSearchParams(window.location.search)
                  for (const key of ["q", "status", "priority", "page"])
                    next.delete(key)
                  window.history.pushState(
                    null,
                    "",
                    `${pathname}${next.size ? `?${next}` : ""}`
                  )
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
          <Table className="ticket-table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Ticket</TableHead>
                <TableHead scope="col">Requester</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Priority</TableHead>
                <TableHead scope="col">Created</TableHead>
                <TableHead scope="col">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <span className="ticket-id">#{ticket.id}</span>
                    <TicketDialog
                      title={ticket.subject}
                      trigger={
                        <Button variant="link" className="ticket-subject">
                          {ticket.subject}
                        </Button>
                      }
                    >
                      <div className="conversation-message">
                        <UserAvatar name={ticket.requester} />
                        <div>
                          <strong>{ticket.requester}</strong>
                          <p>{ticket.description}</p>
                        </div>
                      </div>
                      <p className="conversation-note">
                        Conversation preview. Replies will be available in a
                        future update.
                      </p>
                    </TicketDialog>
                  </TableCell>
                  <TableCell>
                    <div className="requester">
                      <UserAvatar name={ticket.requester} />
                      {ticket.requester}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`status-badge status-${ticket.status.toLowerCase().replace(" ", "-")}`}
                    >
                      <i />
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TicketSelect
                      label={`Priority for ${ticket.id}`}
                      className={`priority-select priority-${ticket.priority.toLowerCase()}`}
                      value={ticket.priority}
                      options={priorities}
                      disabled={ticket.status === "Resolved"}
                      onValueChange={(value) =>
                        update(
                          ticket,
                          { priority: value as Ticket["priority"] },
                          `Priority updated for ${ticket.id}.`
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="ticket-date">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(ticket.createdAt))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={
                        ticket.status === "Resolved" ? "ghost" : "default"
                      }
                      className="ticket-resolve-button"
                      disabled={ticket.status === "Resolved"}
                      aria-label={`Resolve ${ticket.id}`}
                      onClick={() =>
                        update(
                          ticket,
                          { status: "Resolved" },
                          `${ticket.id} resolved.`
                        )
                      }
                    >
                      <Check size={15} />
                      {ticket.status === "Resolved" ? "Resolved" : "Resolve"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filtered.length && (
            <div className="tickets-empty">
              <Search size={28} />
              <h3>No tickets found</h3>
              <p>Try another search or clear your filters.</p>
            </div>
          )}
          <CardFooter className="ticket-pagination">
            <p>
              {filtered.length
                ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length} tickets`
                : "0 tickets"}
            </p>
            <nav aria-label="Ticket pages">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => navigate("page", String(page - 1))}
              >
                <ChevronLeft />
              </Button>
              <span aria-live="polite">
                Page {page} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={page === pageCount}
                onClick={() => navigate("page", String(page + 1))}
              >
                <ChevronRight />
              </Button>
            </nav>
          </CardFooter>
        </Card>
      </main>
    </WorkspaceShell>
  )
}
