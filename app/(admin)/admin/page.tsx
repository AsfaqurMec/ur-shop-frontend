'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  getAdminSummary,
  getAdminSalesSummary,
  getAdminOrdersByStatus,
  getAdminRecentOrders,
  getAdminRevenueHistory,
  getAdminTopProducts,
  getAdminLowStockLicenses,
  type AdminRecentOrder,
  type AdminTopProduct,
  type AdminLowStockLicense,
  type AdminOrdersByStatus,
  type AdminPaymentDistribution,
} from '@/lib/api/admin';
import { AdminPageHeader, AdminRevenueChart, AdminStatusPieChart } from '@/components/admin';
import { Button } from '@/components/ui';
import { IconEye } from '@/components/admin/admin-icons';
import { formatCurrency } from '@/lib/utils/format';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getAdminSummary>> | null>(null);
  const [sales, setSales] = useState<Awaited<ReturnType<typeof getAdminSalesSummary>> | null>(null);
  const [byStatus, setByStatus] = useState<AdminOrdersByStatus[]>([]);
  const [paymentDist, setPaymentDist] = useState<AdminPaymentDistribution | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminRecentOrder[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<Array<{ date: string; revenue: number }>>([]);
  const [topProducts, setTopProducts] = useState<AdminTopProduct[]>([]);
  const [lowStock, setLowStock] = useState<AdminLowStockLicense[]>([]);

  // Independent Period filters
  const [revenuePeriod, setRevenuePeriod] = useState('this_month');
  const [statusPeriod, setStatusPeriod] = useState('this_month');

  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    Promise.all([
      getAdminSummary(),
      getAdminSalesSummary(),
      getAdminOrdersByStatus({ period: 'this_month' }),
      getAdminRecentOrders({ limit: 8 }),
      getAdminRevenueHistory({ period: 'this_month' }),
      getAdminTopProducts(5),
      getAdminLowStockLicenses(5),
    ])
      .then(([s, sa, statusRes, ord, rev, top, low]) => {
        setSummary(s);
        setSales(sa);
        setByStatus(statusRes.by_status || []);
        setPaymentDist(statusRes.payment_distribution || null);
        setRecentOrders(ord.orders);
        setRevenueHistory(rev);
        setTopProducts(top.top_products || []);
        setLowStock(low.low_stock || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  // Revenue chart filter change handler
  const handleRevenuePeriodChange = useCallback((period: string, month?: number, year?: number) => {
    setRevenuePeriod(period);
    setRevenueLoading(true);
    getAdminRevenueHistory({
      period: period.startsWith('m-') ? undefined : period,
      month,
      year,
    })
      .then((history) => setRevenueHistory(history))
      .catch((err) => console.error('Failed to update revenue history:', err))
      .finally(() => setRevenueLoading(false));
  }, []);

  // Status pie chart filter change handler
  const handleStatusPeriodChange = useCallback((period: string, month?: number, year?: number) => {
    setStatusPeriod(period);
    setStatusLoading(true);
    getAdminOrdersByStatus({
      period: period.startsWith('m-') ? undefined : period,
      month,
      year,
    })
      .then((res) => {
        setByStatus(res.by_status || []);
        setPaymentDist(res.payment_distribution || null);
      })
      .catch((err) => console.error('Failed to update status distribution:', err))
      .finally(() => setStatusLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs font-medium text-muted-foreground">Loading store analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-destructive">
        <p className="font-semibold text-sm">Error Loading Dashboard</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  const totalOrders = summary?.orders_total ?? 0;
  const paidOrders = summary?.orders_paid ?? 0;
  const unpaidOrders = Math.max(0, totalOrders - paidOrders);
  const totalRevenue = sales?.total_revenue ?? summary?.revenue_total ?? 0;
  const paidRate = totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0;
  const aov = paidOrders > 0 ? Math.round(totalRevenue / paidOrders) : 0;

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Shortcuts */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AdminPageHeader
            title="Overview & Analytics"
            description="Real-time store performance, revenue insights, and order tracking"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/products/new">
            <Button size="sm" variant="primary" className="shadow-sm">
              + New Product
            </Button>
          </Link>
          <Link href="/admin/coupons">
            <Button size="sm" variant="outline">
              + Add Coupon
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button size="sm" variant="outline">
              All Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Paid Revenue */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              ৳
            </span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(totalRevenue, sales?.currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span>●</span>
            <span>From {paidOrders} paid orders</span>
          </div>
        </div>

        {/* Total Orders */}
        <Link
          href="/admin/orders"
          className="rounded-xl border border-border/80 bg-card p-4 shadow-sm group hover:border-primary/30 transition-colors block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </span>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              →
            </span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{totalOrders}</p>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {unpaidOrders} pending/unpaid
          </div>
        </Link>

        {/* Paid Rate */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Rate
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {paidRate}%
            </span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{paidOrders} Paid</p>
          <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${paidRate}%` }}
            />
          </div>
        </div>

        {/* Customers */}
        <Link
          href="/admin/customers"
          className="rounded-xl border border-border/80 bg-card p-4 shadow-sm group hover:border-primary/30 transition-colors block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Customers
            </span>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              →
            </span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
            {summary?.customers_count ?? 0}
          </p>
          <div className="mt-2 text-[11px] text-muted-foreground">Registered users</div>
        </Link>

        {/* Average Order Value */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Order Value
            </span>
            <span className="text-xs text-muted-foreground">AOV</span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(aov, sales?.currency)}
          </p>
          <div className="mt-2 text-[11px] text-muted-foreground">Per paid purchase</div>
        </div>

        {/* Action / Fulfillment alerts */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Queue & Support
            </span>
            <span className="text-xs font-semibold text-amber-500">
              {(summary?.pending_fulfillment_count ?? 0) + (summary?.pending_tickets_count ?? 0)}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-foreground">
              {summary?.pending_fulfillment_count ?? 0} Queue
            </span>
            <Link
              href="/admin/tickets"
              className="text-xs font-medium text-primary hover:underline"
            >
              {summary?.pending_tickets_count ?? 0} Tickets
            </Link>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">Active attention items</div>
        </div>
      </div>

      {/* Analytics Charts Grid: Revenue Chart on Left, Two Pie Charts on Right */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left Side: Revenue Chart with Month Filter */}
        <div>
          <AdminRevenueChart
            data={revenueHistory}
            currency={sales?.currency || 'BDT'}
            loading={revenueLoading}
            selectedPeriod={revenuePeriod}
            onPeriodChange={handleRevenuePeriodChange}
          />
        </div>

        {/* Right Side: Two Pie Charts (Order Status & Payment Status) with Month Filter */}
        <div>
          <AdminStatusPieChart
            orderStatuses={byStatus}
            paymentDistribution={paymentDist}
            loading={statusLoading}
            selectedPeriod={statusPeriod}
            onPeriodChange={handleStatusPeriodChange}
          />
        </div>
      </div>

      {/* Data Rows: Recent Orders & Top Selling Products */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Recent Orders</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest customer orders and real-time statuses
              </p>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="text-xs font-medium">
                View All Orders →
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold border-b border-border/50">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Order Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No orders placed yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:underline"
                        >
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground truncate max-w-[140px]">
                          {order.customer_name || 'Guest'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {order.shipping_mobile || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            order.status === 'completed' || order.status === 'complete'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : order.status === 'processing'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : order.status === 'cancelled' || order.status === 'refunded'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {order.payment_status || 'unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-foreground whitespace-nowrap">
                        {formatCurrency(order.total, order.currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-black text-white hover:bg-neutral-800 transition-colors shadow-sm dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                          title="View Order Details"
                        >
                          <IconEye className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products (1 col) */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Top Products</h3>
              <p className="text-xs text-muted-foreground mt-0.5">By sales volume & revenue</p>
            </div>
            <Link href="/admin/products">
              <Button variant="ghost" size="sm" className="text-xs font-medium">
                Catalog →
              </Button>
            </Link>
          </div>

          <div className="p-4 space-y-3 flex-1">
            {topProducts.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                No product sales recorded yet
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={p.product_id}
                  className="flex items-center justify-between rounded-xl border border-border/40 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : idx === 1
                          ? 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
                          : idx === 2
                          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                        {p.product_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.quantity_sold} {p.quantity_sold === 1 ? 'unit' : 'units'} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-foreground tabular-nums">
                      {formatCurrency(p.revenue, p.currency)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Low Stock Alert Strip if any */}
          {lowStock.length > 0 && (
            <div className="border-t border-border/60 bg-amber-500/5 p-3.5 rounded-b-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  ⚠️ {lowStock.length} Low Stock Alert{lowStock.length > 1 ? 's' : ''}
                </span>
                <Link
                  href="/admin/products"
                  className="font-medium text-primary hover:underline text-[11px]"
                >
                  Restock →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
