'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTicket } from '@/lib/api/tickets';
import { getMyOrders } from '@/lib/api/dashboard';
import { PageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { toast } from 'sonner';

export default function NewTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<{ id: number; order_number: string }[]>([]);
  useEffect(() => {
    getMyOrders({ limit: 20 }).then((r) =>
      setOrders(r.orders.map((o) => ({ id: o.id, order_number: o.order_number })))
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required');
      return;
    }
    setLoading(true);
    try {
      await createTicket({
        subject: subject.trim(),
        message: message.trim(),
        order_id: orderId ? Number(orderId) : undefined,
        attachment: file ?? undefined,
      });
      toast.success('Ticket created');
      router.push('/dashboard/tickets');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create ticket';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="New ticket">
        <Link href="/dashboard/tickets">
          <Button variant="outline">Back</Button>
        </Link>
      </PageHeader>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div>
          <label htmlFor="subject" className="text-sm font-medium">Subject</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Brief summary of your issue"
            maxLength={255}
          />
        </div>
        <div>
          <label htmlFor="message" className="text-sm font-medium">Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Describe your issue in detail"
            required
          />
        </div>
        <div>
          <label htmlFor="order_id" className="text-sm font-medium">Link to order (optional)</label>
          <select
            id="order_id"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>#{o.order_number}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="attachment" className="text-sm font-medium">Attachment (optional)</label>
          <input
            id="attachment"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </div>
        <Button type="submit" isLoading={loading}>Create ticket</Button>
      </form>
    </div>
  );
}
