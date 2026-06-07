'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminTicketDetails, updateTicketStatus, adminReplyToTicket } from '@/lib/api/admin';
import type { TicketDetail } from '@/lib/api/tickets';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { getApiBaseUrl } from '@/lib/api/baseUrl';
import { toast } from 'sonner';

const getBaseUrl = () => getApiBaseUrl().replace(/\/$/, '');

export default function AdminTicketDetailPage() {
  const params = useParams();
  const id = params?.id ? Number(params.id) : NaN;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = () => {
    if (Number.isNaN(id)) return;
    getAdminTicketDetails(id)
      .then(setTicket)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      await updateTicketStatus(id, newStatus);
      load();
      toast.success('Ticket status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await adminReplyToTicket(id, { message: reply.trim(), attachment: replyFile ?? undefined });
      setReply('');
      setReplyFile(null);
      load();
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div>
        <AdminPageHeader title="Ticket" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">{error ?? 'Not found'}</div>
        <Link href="/admin/tickets" className="mt-4 inline-block">
          <Button variant="outline">Back to tickets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title={ticket.subject}>
        <Link href="/admin/tickets">
          <Button variant="outline">Back to tickets</Button>
        </Link>
      </AdminPageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium capitalize">
          {ticket.status.replace(/_/g, ' ')}
        </span>
        {ticket.status !== 'closed' && (
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusUpdating}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="open">Open</option>
            <option value="answered">Answered</option>
            <option value="customer_reply">Customer reply</option>
            <option value="closed">Closed</option>
          </select>
        )}
      </div>
      <div className="space-y-4">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg border p-4 ${msg.sender_type === 'admin' ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'}`}
          >
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium capitalize">{msg.sender_type}</span>
              <span className="text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
            {msg.attachments?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {msg.attachments.map((a) => {
                  const url = a.url_path.startsWith('http') ? a.url_path : `${getBaseUrl()}${a.url_path.startsWith('/') ? '' : '/'}${a.url_path}`;
                  return (
                    <a key={a.id} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {a.file_name}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      {ticket.status !== 'closed' && (
        <form onSubmit={handleReply} className="mt-6 max-w-xl space-y-4">
          <div>
            <label className="text-sm font-medium">Reply</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="mt-1 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Attachment (optional)</label>
            <input
              type="file"
              onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </div>
          <Button type="submit" disabled={!reply.trim()} isLoading={submitting}>Send reply</Button>
        </form>
      )}
    </div>
  );
}
