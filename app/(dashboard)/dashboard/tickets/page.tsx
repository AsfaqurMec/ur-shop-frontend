'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { listMyTickets } from '@/lib/api/tickets';
import { getAuthToken } from '@/lib/api/client';
import { getAccessTokenUserId } from '@/lib/auth/token';
import { markAnsweredTicketsSeenFromList } from '@/lib/utils/supportTicketReadState';
import { PageHeader, EmptyState, StatusBadge } from '@/components/dashboard';
import { Button, Pagination } from '@/components/ui';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'answered', label: 'Answered' },
  { value: 'customer_reply', label: 'Customer reply' },
  { value: 'closed', label: 'Closed' },
] as const;

function DashboardTicketsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') ?? '';
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof listMyTickets>>['tickets']>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offset = (pageFromUrl - 1) * PAGE_SIZE;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listMyTickets({
      status: statusFilter || undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then((r) => {
        if (cancelled) return;
        setTickets(r.tickets);
        setTotal(r.total);
        const uid = getAccessTokenUserId(getAuthToken());
        if (uid != null) {
          markAnsweredTicketsSeenFromList(uid, r.tickets);
        }
        const totalPages = Math.max(1, Math.ceil(r.total / PAGE_SIZE) || 1);
        if (r.total > 0 && pageFromUrl > totalPages) {
          const p = new URLSearchParams(searchParams.toString());
          if (totalPages <= 1) p.delete('page');
          else p.set('page', String(totalPages));
          router.replace(p.toString() ? `${pathname}?${p}` : pathname);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageFromUrl, statusFilter, pathname, router, searchParams]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const setStatus = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!next) params.delete('status');
    else params.set('status', next);
    params.delete('page');
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const showEmpty = !loading && total === 0;

  return (
    <div>
      <PageHeader title="Support tickets" description="View and manage your support requests">
        <Link href="/dashboard/tickets/new">
          <Button>New ticket</Button>
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="ticket-status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="ticket-status-filter"
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          disabled={loading}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {showEmpty ? (
        <EmptyState
          title={statusFilter ? 'No tickets match this filter' : 'No tickets'}
          description={
            statusFilter
              ? 'Try another status or clear the filter to see all tickets.'
              : 'Create a support ticket if you need help.'
          }
          action={
            statusFilter ? (
              <Button type="button" variant="outline" onClick={() => setStatus('')}>
                Clear filter
              </Button>
            ) : (
              <Link href="/dashboard/tickets/new">
                <Button>New ticket</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className={`space-y-3 ${loading ? 'pointer-events-none opacity-60' : ''}`}>
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.id}`}
                className="block rounded-lg border p-4 hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-muted-foreground text-sm">
                      {ticket.order_number ? `Order #${ticket.order_number}` : 'No order linked'} ·{' '}
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Pagination
              page={pageFromUrl}
              pageSize={PAGE_SIZE}
              totalItems={total}
              onPageChange={setPage}
              disabled={loading}
              ariaLabel="Support tickets pagination"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <DashboardTicketsContent />
    </Suspense>
  );
}
