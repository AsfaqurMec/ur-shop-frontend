import { apiGet, apiPost, apiPostFormData, type RequestConfig } from './client';
import type { PaymentMethod, PaymentProof } from '@/types/payment';

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data as T;
}

/** List available payment methods (public). */
export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await apiGet<{ payment_methods: PaymentMethod[] }>('payments/methods', {
    skipAuth: true,
  });
  const data = unwrap(res);
  return data.payment_methods;
}

export interface SubmitProofBody {
  sender_number?: string;
  transaction_id?: string;
  paid_amount?: number;
}

/** Submit payment proof for an order (requires auth). File field name: proof. Accepted: image (jpeg, png, gif, webp). */
export async function submitPaymentProof(
  orderId: number,
  file: File,
  body?: SubmitProofBody
): Promise<PaymentProof> {
  const formData = new FormData();
  formData.append('proof', file);
  if (body?.sender_number != null) formData.append('sender_number', body.sender_number);
  if (body?.transaction_id != null) formData.append('transaction_id', body.transaction_id);
  if (body?.paid_amount != null)
    formData.append('paid_amount', String(body.paid_amount));
  const res = await apiPostFormData<{ proof: PaymentProof }>(
    `payments/orders/${orderId}/proof`,
    formData
  );
  const data = unwrap(res);
  return data.proof;
}

/** Get payment proofs for an order (requires auth). */
export async function getProofsForOrder(orderId: number): Promise<PaymentProof[]> {
  const res = await apiGet<{ proofs: PaymentProof[] }>(`payments/orders/${orderId}/proofs`);
  const data = unwrap(res);
  return data.proofs;
}

export interface BkashExecuteResult {
  order_id: number;
  order_number?: string;
  status?: string;
  already_completed?: boolean;
}

/** After returning from bKash checkout (requires auth). Use `skip401Redirect` on the callback page so users can sign in and retry with the same URL. */
export async function executeBkashPayment(
  body: { payment_id: string },
  options?: Pick<RequestConfig, 'skip401Redirect'>
): Promise<BkashExecuteResult> {
  const res = await apiPost<BkashExecuteResult>('payments/bkash/execute', body, {
    skip401Redirect: options?.skip401Redirect,
  });
  return unwrap(res);
}
