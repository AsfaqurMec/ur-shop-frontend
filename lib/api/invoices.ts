import { getApiBaseUrl } from './baseUrl';
import { getAuthToken } from './client';

/** Download an authenticated order invoice and save it with the server-provided filename. */
export async function downloadOrderInvoice(orderId: number): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const base = getApiBaseUrl().replace(/\/$/, '');
  const response = await fetch(`${base}/dashboard/orders/${orderId}/invoice`, {
    credentials: 'include',
    headers,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    throw new Error(payload?.error || payload?.message || 'Could not download the invoice.');
  }

  const contentDisposition = response.headers.get('content-disposition') || '';
  const filename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || `invoice-${orderId}.pdf`;
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
