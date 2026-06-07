import { apiGet } from './client';

export interface DashboardOrderListItem {
  id: number;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
}

export interface DashboardOrderDetail {
  id: number;
  order_number: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    product_type: string;
    product_thumbnail: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    purchase_selections_summary?: Array<{ label: string; value: string }> | null;
  }>;
  payment: { id: number; gateway: string; status: string; amount: number; currency: string } | null;
  delivery: { status: string; delivered_at: string | null } | null;
  created_at: string;
}

export interface DashboardLicenseItem {
  id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_name: string;
  license_key: string;
  assigned_at: string;
}

export interface DashboardSubscriptionItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_variation_id: number | null;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface DashboardPendingSubscriptionItem {
  queue_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_variation_id: number | null;
  status: 'pending_activation';
  due_at: string | null;
  created_at: string;
}

export interface DashboardDeliveredItem {
  type: 'download' | 'license' | 'subscription' | 'fulfillment';
  order_id: number;
  order_number: string;
  product_id: number;
  product_name: string;
  product_type: string;
  detail: string | null;
  created_at: string;
}

export interface DashboardSummary {
  orders_total: number;
  orders_pending: number;
  orders_paid: number;
  downloads_count: number;
  licenses_count: number;
  subscriptions_count: number;
  delivered_count: number;
}

export interface DownloadableItem {
  entitlement_id: number;
  order_item_id: number;
  order_id: number;
  order_number: string;
  product_id: number;
  product_name: string;
  product_file_id: number;
  file_name: string;
  file_size: number | null;
  download_count: number;
  download_limit: number | null;
  expires_at: string | null;
  created_at: string;
}

function unwrap<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success || res.data === undefined) throw new Error(res.error ?? 'Request failed');
  return res.data as T;
}

export async function getMyOrders(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ orders: DashboardOrderListItem[]; total: number }> {
  const res = await apiGet<{ orders: DashboardOrderListItem[]; total: number }>('dashboard/orders', {
    params: params as Record<string, number>,
  });
  return unwrap(res);
}

export async function getOrderDetails(orderId: number): Promise<DashboardOrderDetail> {
  const res = await apiGet<DashboardOrderDetail>(`dashboard/orders/${orderId}`);
  return unwrap(res);
}

export async function getMyDownloads(): Promise<{ items: DownloadableItem[] }> {
  const res = await apiGet<{ items: DownloadableItem[] }>('dashboard/downloads');
  return unwrap(res);
}

export async function getMyLicenses(): Promise<{ items: DashboardLicenseItem[] }> {
  const res = await apiGet<{ items: DashboardLicenseItem[] }>('dashboard/licenses');
  return unwrap(res);
}

export async function getMySubscriptions(): Promise<{ items: DashboardSubscriptionItem[] }> {
  const res = await apiGet<{ items: DashboardSubscriptionItem[] }>('dashboard/subscriptions');
  return unwrap(res);
}

export async function getMyPendingSubscriptions(): Promise<{ items: DashboardPendingSubscriptionItem[] }> {
  const res = await apiGet<{ items: DashboardPendingSubscriptionItem[] }>('dashboard/subscriptions/pending');
  return unwrap(res);
}

export async function getMyDeliveredItems(): Promise<{ items: DashboardDeliveredItem[] }> {
  const res = await apiGet<{ items: DashboardDeliveredItem[] }>('dashboard/delivered');
  return unwrap(res);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiGet<{ summary: DashboardSummary }>('dashboard/summary');
  const data = unwrap(res);
  return data.summary;
}
