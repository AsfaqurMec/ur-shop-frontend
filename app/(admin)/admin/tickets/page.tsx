'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminTickets } from '@/lib/api/admin';
import { AdminPageHeader, DataTable } from '@/components/admin';
import type { TicketListItem } from '@/lib/api/tickets';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    getAdminTickets({ status: statusFilter || undefined, limit: 100 })
      .then((r) => setTickets(r.tickets))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Tickets" description="Support tickets" />
      <div className="mb-4 flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="answered">Answered</option>
          <option value="customer_reply">Customer reply</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      <DataTable<TicketListItem>
        columns={[
          { key: 'id', header: 'ID' },
          { key: 'subject', header: 'Subject' },
          { key: 'status', header: 'Status', render: (r) => <span className="capitalize">{r.status.replace(/_/g, ' ')}</span> },
          { key: 'order_number', header: 'Order', render: (r) => r.order_number ?? '—' },
          { key: 'created_at', header: 'Created', render: (r) => new Date(r.created_at).toLocaleString() },
          {
            key: 'actions',
            header: '',
            render: (r) => (
              <Link href={`/admin/tickets/${r.id}`} className="text-primary hover:underline">
                View
              </Link>
            ),
          },
        ]}
        data={tickets}
        keyExtractor={(r) => r.id}
        emptyMessage="No tickets"
      />
    </div>
  );
}
