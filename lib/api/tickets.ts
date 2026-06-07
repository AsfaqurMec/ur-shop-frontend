import { apiGet, apiPost, apiPostFormData } from './client';

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data as T;
}

export type TicketStatus = 'open' | 'answered' | 'customer_reply' | 'closed';

export interface TicketListItem {
  id: number;
  subject: string;
  status: TicketStatus;
  order_id: number | null;
  order_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketAttachment {
  id: number;
  file_name: string;
  file_size: number | null;
  url_path: string;
}

export interface TicketMessage {
  id: number;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
  attachments: TicketAttachment[];
}

export interface TicketDetail {
  id: number;
  subject: string;
  status: TicketStatus;
  order_id: number | null;
  order_number: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

export async function listMyTickets(
  params?: { status?: string; limit?: number; offset?: number }
): Promise<{ tickets: TicketListItem[]; total: number }> {
  const res = await apiGet<{ tickets: TicketListItem[]; total: number }>('tickets', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
  return unwrap(res);
}

export async function getTicketDetails(ticketId: number): Promise<TicketDetail> {
  const res = await apiGet<TicketDetail>(`tickets/${ticketId}`);
  return unwrap(res);
}

export async function createTicket(data: {
  subject: string;
  message: string;
  order_id?: number | null;
  attachment?: File;
}): Promise<TicketDetail> {
  const formData = new FormData();
  formData.append('subject', data.subject.trim());
  formData.append('message', data.message.trim());
  if (data.order_id != null) formData.append('order_id', String(data.order_id));
  if (data.attachment) formData.append('attachment', data.attachment);
  const res = await apiPostFormData<TicketDetail>('tickets', formData);
  return unwrap(res);
}

export async function replyToTicket(
  ticketId: number,
  data: { message: string; attachment?: File }
): Promise<TicketDetail> {
  const formData = new FormData();
  formData.append('message', data.message.trim());
  if (data.attachment) formData.append('attachment', data.attachment);
  const res = await apiPostFormData<TicketDetail>(`tickets/${ticketId}/reply`, formData);
  return unwrap(res);
}
