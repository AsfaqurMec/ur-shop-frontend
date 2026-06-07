/**
 * Client-side "read" state for Support answered tickets (notification-style badge).
 * Stores last acknowledged `updated_at` per ticket so new admin replies surface the badge again.
 */

export const SUPPORT_TICKETS_READ_EVENT = 'dp-support-tickets-read';

export const SUPPORT_TICKET_READ_STORAGE_PREFIX = 'dp_support_answered_seen_v1';

function key(userId: number): string {
  return `${SUPPORT_TICKET_READ_STORAGE_PREFIX}:${userId}`;
}

function loadSeenMap(userId: number): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function saveSeenMap(userId: number, map: Record<string, string>): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

function dispatchRead(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SUPPORT_TICKETS_READ_EVENT));
}

export type TicketLike = { id: number; status: string; updated_at: string };

/** Answered tickets the user has not "seen" yet at the current `updated_at`. */
export function getUnreadAnsweredCount(userId: number, tickets: TicketLike[]): number {
  const seen = loadSeenMap(userId);
  let n = 0;
  for (const t of tickets) {
    if (t.status !== 'answered') continue;
    const ack = seen[String(t.id)];
    if (!ack || new Date(ack).getTime() < new Date(t.updated_at).getTime()) {
      n++;
    }
  }
  return n;
}

/** Call when the support list loads — marks every answered row as seen at its current `updated_at`. */
export function markAnsweredTicketsSeenFromList(userId: number, tickets: TicketLike[]): void {
  const seen = loadSeenMap(userId);
  for (const t of tickets) {
    if (t.status === 'answered') {
      seen[String(t.id)] = t.updated_at;
    }
  }
  saveSeenMap(userId, seen);
  dispatchRead();
}

/** Call when a ticket detail loads (or after viewing the latest reply). */
export function markAnsweredTicketSeen(userId: number, ticket: TicketLike): void {
  if (ticket.status !== 'answered') return;
  const seen = loadSeenMap(userId);
  seen[String(ticket.id)] = ticket.updated_at;
  saveSeenMap(userId, seen);
  dispatchRead();
}
