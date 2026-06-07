'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTicketDetails, replyToTicket } from '@/lib/api/tickets';
import type { TicketDetail } from '@/lib/api/tickets';
import { PageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { getApiBaseUrl } from '@/lib/api/baseUrl';
import { getAuthToken } from '@/lib/api/client';
import { getAccessTokenUserId } from '@/lib/auth/token';
import { markAnsweredTicketSeen } from '@/lib/utils/supportTicketReadState';
import { toast } from 'sonner';

const getBaseUrl = () => getApiBaseUrl().replace(/\/$/, '');

export default function TicketDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const ticketId = id ? Number(id) : NaN;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = async () => {
    if (!ticketId || Number.isNaN(ticketId)) return;
    try {
      const t = await getTicketDetails(ticketId);
      setTicket(t);
      const uid = getAccessTokenUserId(getAuthToken());
      if (uid != null) {
        markAnsweredTicketSeen(uid, t);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ticketId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !reply.trim()) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const updated = await replyToTicket(ticketId, {
        message: reply.trim(),
        attachment: replyFile ?? undefined,
      });
      setTicket(updated);
      const uid = getAccessTokenUserId(getAuthToken());
      if (uid != null) {
        markAnsweredTicketSeen(uid, updated);
      }
      setReply('');
      setReplyFile(null);
      toast.success('Reply sent');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reply';
      setSubmitError(msg);
      toast.error(msg);
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
        <PageHeader title="Ticket" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">{error ?? 'Not found'}</div>
        <Link href="/dashboard/tickets" className="mt-4 inline-block">
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    );
  }

  const canReply = ticket.status !== 'closed';

  return (
    <div>
      <PageHeader title={ticket.subject}>
        <Link href="/dashboard/tickets">
          <Button variant="outline">Back</Button>
        </Link>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={ticket.status} />
        {ticket.order_number && (
          <Link href={`/dashboard/orders/${ticket.order_id}`} className="text-sm text-primary hover:underline">
            Order #{ticket.order_number}
          </Link>
        )}
      </div>
      <div className="space-y-4">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg border p-4 ${
              msg.sender_type === 'admin' ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'
            }`}
          >
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium capitalize">{msg.sender_type}</span>
              <span className="text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
            {msg.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {msg.attachments.map((a) => {
                  const url = a.url_path.startsWith('http')
                    ? a.url_path
                    : `${getBaseUrl()}${a.url_path.startsWith('/') ? '' : '/'}${a.url_path}`;
                  return (
                    <a
                      key={a.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {a.file_name}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      {canReply && (
        <form onSubmit={handleReply} className="mt-6 max-w-xl space-y-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          <div>
            <label htmlFor="reply" className="text-sm font-medium">Your reply</label>
            <textarea
              id="reply"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="mt-1 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Type your message..."
              required
            />
          </div>
          <div>
            <label htmlFor="replyFile" className="text-sm font-medium">Attachment (optional)</label>
            <input
              id="replyFile"
              type="file"
              onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </div>
          <Button type="submit" disabled={!reply.trim()} isLoading={submitting}>
            Send reply
          </Button>
        </form>
      )}
      {!canReply && (
        <p className="mt-4 text-muted-foreground text-sm">This ticket is closed. Create a new ticket for further support.</p>
      )}
    </div>
  );
}
