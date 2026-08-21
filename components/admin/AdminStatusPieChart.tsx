'use client';

import { useState, useMemo } from 'react';
import type { AdminOrdersByStatus, AdminPaymentDistribution } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/format';

interface AdminStatusPieChartProps {
  orderStatuses: AdminOrdersByStatus[];
  paymentDistribution?: AdminPaymentDistribution | null;
  loading?: boolean;
  selectedPeriod: string;
  onPeriodChange: (period: string, month?: number, year?: number) => void;
}

const ORDER_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  completed: { color: '#10b981', label: 'Completed' },
  complete: { color: '#10b981', label: 'Completed' },
  processing: { color: '#3b82f6', label: 'Processing' },
  pending: { color: '#f59e0b', label: 'Pending' },
  cancelled: { color: '#ef4444', label: 'Cancelled' },
  refunded: { color: '#a855f7', label: 'Refunded' },
  placed: { color: '#6366f1', label: 'Placed' },
  delivered: { color: '#14b8a6', label: 'Delivered' },
};

const DEFAULT_CONFIG = { color: '#94a3b8', label: 'Other' };

interface SliceItem {
  key: string;
  label: string;
  count: number;
  color: string;
  percent: number;
  extra?: string;
}

function DonutRing({
  slices,
  totalCount,
  centerLabel = 'Orders',
}: {
  slices: SliceItem[];
  totalCount: number;
  centerLabel?: string;
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const size = 150;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Filter non-zero slices
  const activeSlices = slices.filter((s) => s.count > 0);

  // Calculate stroke dash offsets
  let accumulatedPercent = 0;
  const sliceElements = activeSlices.map((slice) => {
    const fraction = totalCount > 0 ? slice.count / totalCount : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += fraction;

    const isHovered = hoveredKey === slice.key;

    return {
      ...slice,
      strokeDasharray,
      strokeDashoffset,
      isHovered,
    };
  });

  const highlightedItem = activeSlices.find((s) => s.key === hoveredKey) || null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 select-none overflow-visible"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />

          {totalCount > 0 &&
            sliceElements.map((slice) => (
              <circle
                key={slice.key}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={slice.isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="butt"
                className={`transition-all duration-200 cursor-pointer ${
                  slice.isHovered ? 'filter brightness-110 drop-shadow-md' : 'opacity-90 hover:opacity-100'
                }`}
                onMouseEnter={() => setHoveredKey(slice.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
            ))}
        </svg>

        {/* Center Text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          {highlightedItem ? (
            <>
              <span className="text-lg font-bold text-foreground tabular-nums leading-tight">
                {highlightedItem.count}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate max-w-[85px]">
                {highlightedItem.percent}% {highlightedItem.label}
              </span>
            </>
          ) : (
            <>
              <span className="text-xl font-extrabold text-foreground tabular-nums leading-tight">
                {totalCount}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {centerLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div className="mt-4 w-full space-y-1.5">
        {slices.length === 0 || totalCount === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No data in this period</p>
        ) : (
          slices.map((slice) => {
            const isHovered = hoveredKey === slice.key;
            return (
              <div
                key={slice.key}
                onMouseEnter={() => setHoveredKey(slice.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer border ${
                  isHovered ? 'border-border bg-muted/60' : 'border-transparent hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-medium text-foreground truncate capitalize">
                    {slice.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="font-bold text-foreground tabular-nums">{slice.count}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {slice.percent}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function AdminStatusPieChart({
  orderStatuses,
  paymentDistribution,
  loading = false,
  selectedPeriod,
  onPeriodChange,
}: AdminStatusPieChartProps) {
  // Month options for filter dropdown
  const now = new Date();
  const currentYear = now.getFullYear();
  const monthOptions = [
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last 3 Months', value: 'last_3_months' },
    { label: 'Last 6 Months', value: 'last_6_months' },
    { label: 'This Year (2026)', value: 'this_year' },
    { label: 'January', value: `m-1-${currentYear}` },
    { label: 'February', value: `m-2-${currentYear}` },
    { label: 'March', value: `m-3-${currentYear}` },
    { label: 'April', value: `m-4-${currentYear}` },
    { label: 'May', value: `m-5-${currentYear}` },
    { label: 'June', value: `m-6-${currentYear}` },
    { label: 'July', value: `m-7-${currentYear}` },
    { label: 'August', value: `m-8-${currentYear}` },
    { label: 'September', value: `m-9-${currentYear}` },
    { label: 'October', value: `m-10-${currentYear}` },
    { label: 'November', value: `m-11-${currentYear}` },
    { label: 'December', value: `m-12-${currentYear}` },
  ];

  const handleSelectFilter = (val: string) => {
    if (val.startsWith('m-')) {
      const parts = val.split('-');
      const m = parseInt(parts[1], 10);
      const yr = parseInt(parts[2], 10);
      onPeriodChange(val, m, yr);
    } else {
      onPeriodChange(val);
    }
  };

  // 1. Order Status Slices
  const totalOrderCount = orderStatuses.reduce((s, item) => s + item.count, 0);
  const orderStatusSlices: SliceItem[] = useMemo(() => {
    const definedStatuses = ['completed', 'processing', 'pending', 'cancelled', 'refunded'];
    const map = new Map(orderStatuses.map((item) => [item.status.toLowerCase(), item.count]));

    // Include standard statuses with non-zero or defined statuses
    return definedStatuses
      .map((statusKey) => {
        const count = map.get(statusKey) || (statusKey === 'completed' ? map.get('complete') || 0 : 0);
        const config = ORDER_STATUS_CONFIG[statusKey] || DEFAULT_CONFIG;
        const percent = totalOrderCount > 0 ? Math.round((count / totalOrderCount) * 100) : 0;
        return {
          key: statusKey,
          label: config.label,
          count,
          color: config.color,
          percent,
        };
      })
      .filter((s) => s.count > 0 || totalOrderCount === 0);
  }, [orderStatuses, totalOrderCount]);

  // 2. Payment Status Slices
  const paidCount = paymentDistribution?.paid ?? 0;
  const unpaidCount = paymentDistribution?.unpaid ?? 0;
  const totalPaymentCount = paidCount + unpaidCount;

  const paymentStatusSlices: SliceItem[] = useMemo(() => {
    const paidPercent = totalPaymentCount > 0 ? Math.round((paidCount / totalPaymentCount) * 100) : 0;
    const unpaidPercent = totalPaymentCount > 0 ? 100 - paidPercent : 0;

    return [
      {
        key: 'paid',
        label: 'Paid',
        count: paidCount,
        color: '#10b981',
        percent: paidPercent,
        extra: paymentDistribution?.paid_revenue ? formatCurrency(paymentDistribution.paid_revenue) : undefined,
      },
      {
        key: 'unpaid',
        label: 'Unpaid',
        count: unpaidCount,
        color: '#f59e0b',
        percent: unpaidPercent,
        extra: paymentDistribution?.unpaid_revenue ? formatCurrency(paymentDistribution.unpaid_revenue) : undefined,
      },
    ];
  }, [paidCount, unpaidCount, totalPaymentCount, paymentDistribution]);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-6">
      {/* Top Header with Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground">Status Breakdown</h3>
            {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Order lifecycle & payment status distributions
          </p>
        </div>

        {/* Month Filter Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Filter:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => handleSelectFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Side-by-Side Donut Charts */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Chart 1: Order Status */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 flex flex-col justify-between">
          <div className="border-b border-border/40 pb-2.5 mb-4 flex items-center justify-between">
            <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
              1. Order Status
            </h4>
            <span className="text-[10px] text-muted-foreground">5 Lifecycle States</span>
          </div>
          <DonutRing
            slices={orderStatusSlices}
            totalCount={totalOrderCount}
            centerLabel="Orders"
          />
        </div>

        {/* Chart 2: Payment Status */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 flex flex-col justify-between">
          <div className="border-b border-border/40 pb-2.5 mb-4 flex items-center justify-between">
            <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
              2. Payment Status
            </h4>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {paidCount} Paid ({totalPaymentCount > 0 ? Math.round((paidCount / totalPaymentCount) * 100) : 0}%)
            </span>
          </div>
          <DonutRing
            slices={paymentStatusSlices}
            totalCount={totalPaymentCount}
            centerLabel="Payments"
          />
        </div>
      </div>
    </div>
  );
}
