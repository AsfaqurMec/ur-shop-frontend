'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/format';

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface AdminRevenueChartProps {
  data: RevenueDataPoint[];
  currency?: string;
  loading?: boolean;
  selectedPeriod: string;
  onPeriodChange: (period: string, month?: number, year?: number) => void;
}

export function AdminRevenueChart({
  data,
  currency = 'BDT',
  loading = false,
  selectedPeriod,
  onPeriodChange,
}: AdminRevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'area' | 'bar'>('area');

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  const stats = useMemo(() => {
    if (!chartData.length) return { total: 0, avg: 0, max: 0, maxDate: '' };
    const total = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const avg = Math.round(total / chartData.length);
    let max = 0;
    let maxDate = '';
    chartData.forEach((d) => {
      if (d.revenue > max) {
        max = d.revenue;
        maxDate = d.date;
      }
    });
    return { total, avg, max, maxDate };
  }, [chartData]);

  // Current year/months for month options
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

  // Dimensions
  const width = 600;
  const height = 230;
  const paddingX = 42;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...chartData.map((d) => d.revenue), 100);
  const yTicks = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), Math.round(maxVal)];

  const getX = (index: number) => {
    if (chartData.length <= 1) return paddingX + innerWidth / 2;
    return paddingX + (index / (chartData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return paddingTop + innerHeight - (val / maxVal) * innerHeight;
  };

  const points = chartData.map((d, i) => ({ x: getX(i), y: getY(d.revenue) }));

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (!linePath || points.length === 0) return '';
    const bottomY = paddingTop + innerHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, points, innerHeight]);

  const activePoint = hoveredIndex !== null && chartData[hoveredIndex] ? chartData[hoveredIndex] : null;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground">Revenue Analytics</h3>
            {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paid orders revenue performance and trend analysis
          </p>
        </div>

        {/* Filters and mode toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month / Period Filter Dropdown */}
          <div className="flex items-center gap-1.5">
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

          {/* Curve vs Bars View Mode */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('area')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'area'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Curve
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bar')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'bar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bars
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-3 gap-4 py-4 border-b border-border/40 bg-muted/10 -mx-5 px-5">
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Period Revenue
          </span>
          <p className="text-lg font-extrabold text-foreground tabular-nums mt-0.5">
            {formatCurrency(stats.total, currency)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Daily Average
          </span>
          <p className="text-lg font-extrabold text-foreground tabular-nums mt-0.5">
            {formatCurrency(stats.avg, currency)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Peak Day
          </span>
          <p className="text-lg font-extrabold text-foreground tabular-nums mt-0.5">
            {stats.max > 0 ? formatCurrency(stats.max, currency) : '—'}
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-4">
        {chartData.length === 0 ? (
          <div className="flex h-52 items-center justify-center text-xs text-muted-foreground">
            No sales recorded for this period
          </div>
        ) : (
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-52 overflow-visible select-none"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.65" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {yTicks.map((tickVal) => {
                const y = getY(tickVal);
                return (
                  <g key={tickVal}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      className="text-border/60"
                      strokeWidth={1}
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fill="currentColor"
                      className="text-muted-foreground font-mono font-medium"
                    >
                      {tickVal >= 1000 ? `${(tickVal / 1000).toFixed(0)}k` : tickVal}
                    </text>
                  </g>
                );
              })}

              {/* Area View */}
              {viewMode === 'area' && (
                <>
                  <path d={areaPath} fill="url(#revenueAreaGradient)" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={hoveredIndex === i ? 5.5 : 3}
                      className={`transition-all duration-150 ${
                        hoveredIndex === i
                          ? 'fill-emerald-400 stroke-background stroke-2 drop-shadow-sm'
                          : 'fill-emerald-500'
                      }`}
                    />
                  ))}
                </>
              )}

              {/* Bar View */}
              {viewMode === 'bar' && (
                <>
                  {chartData.map((d, i) => {
                    const x = getX(i);
                    const barWidth = Math.max(6, Math.min(18, innerWidth / (chartData.length * 1.5)));
                    const y = getY(d.revenue);
                    const barHeight = paddingTop + innerHeight - y;
                    const isHovered = hoveredIndex === i;
                    return (
                      <rect
                        key={i}
                        x={x - barWidth / 2}
                        y={y}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        rx={2.5}
                        fill="url(#revenueBarGradient)"
                        className={`transition-all duration-150 ${
                          isHovered ? 'opacity-100 filter brightness-110' : 'opacity-85 hover:opacity-100'
                        }`}
                      />
                    );
                  })}
                </>
              )}

              {/* Hover Crosshair line */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <line
                  x1={points[hoveredIndex].x}
                  y1={paddingTop}
                  x2={points[hoveredIndex].x}
                  y2={paddingTop + innerHeight}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-foreground/50"
                  strokeDasharray="2 2"
                />
              )}

              {/* Interactive Hover Hitboxes */}
              {chartData.map((_, i) => {
                const x = getX(i);
                const step = innerWidth / chartData.length;
                return (
                  <rect
                    key={i}
                    x={x - step / 2}
                    y={paddingTop}
                    width={step}
                    height={innerHeight + paddingBottom}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                  />
                );
              })}

              {/* X-axis Date Labels */}
              {chartData.map((d, i) => {
                const showLabel =
                  chartData.length <= 8 ||
                  i === 0 ||
                  i === chartData.length - 1 ||
                  i % Math.ceil(chartData.length / 6) === 0;
                if (!showLabel) return null;
                const x = getX(i);
                const label = new Date(d.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                });
                return (
                  <text
                    key={i}
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="currentColor"
                    className="text-muted-foreground font-medium"
                  >
                    {label}
                  </text>
                );
              })}
            </svg>

            {/* Floating Tooltip */}
            {activePoint && hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="pointer-events-none absolute z-10 rounded-lg border border-border/90 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md -translate-x-1/2 -translate-y-full transition-transform"
                style={{
                  left: `${(points[hoveredIndex].x / width) * 100}%`,
                  top: `${(points[hoveredIndex].y / height) * 100 - 4}%`,
                }}
              >
                <div className="font-bold text-foreground">
                  {formatCurrency(activePoint.revenue, currency)}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">
                  {new Date(activePoint.date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
