'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getAdminEmailLogs } from '@/lib/api/admin';
import { AdminPageHeader, DataTable, Modal } from '@/components/admin';
import { Pagination } from '@/components/ui';
import type { AdminEmailLog } from '@/lib/api/admin';

const PAGE_SIZE = 10;
const SUBJECT_PREVIEW_WORDS = 30;

function truncateWords(text: string, maxWords: number): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  return `${words.slice(0, maxWords).join(' ')}…`;
}

function AdminEmailsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const templateFromUrl = searchParams.get('template')?.trim() || '';

  const [logs, setLogs] = useState<AdminEmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [templateOptions, setTemplateOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLog, setDetailLog] = useState<AdminEmailLog | null>(null);

  const offset = (pageFromUrl - 1) * PAGE_SIZE;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminEmailLogs({
      limit: PAGE_SIZE,
      offset,
      ...(templateFromUrl ? { template: templateFromUrl } : {}),
    })
      .then((r) => {
        if (cancelled) return;
        setLogs(r.logs);
        setTotal(r.total);
        setTemplateOptions(r.templates);
        const totalPages = Math.max(1, Math.ceil(r.total / PAGE_SIZE) || 1);
        if (r.total > 0 && pageFromUrl > totalPages) {
          const p = new URLSearchParams(searchParams.toString());
          if (totalPages <= 1) p.delete('page');
          else p.set('page', String(totalPages));
          router.replace(p.toString() ? `${pathname}?${p}` : pathname);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [offset, pageFromUrl, pathname, router, searchParams, templateFromUrl]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const onTemplateChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (!value) params.delete('template');
    else params.set('template', value);
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const selectOptions = useMemo(() => {
    const set = new Set(templateOptions);
    if (templateFromUrl && !set.has(templateFromUrl)) set.add(templateFromUrl);
    return Array.from(set).sort();
  }, [templateFromUrl, templateOptions]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Email log"
        description="Outbound messages recorded when templates are sent (and failures)."
      />
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex max-w-xs flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Template</span>
          <select
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={templateFromUrl}
            onChange={(e) => onTemplateChange(e.target.value)}
            aria-label="Filter by email template"
          >
            <option value="">All templates</option>
            {selectOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={loading ? 'pointer-events-none opacity-60' : ''}>
        <DataTable<AdminEmailLog>
          striped
          columns={[
            { key: 'id', header: 'ID' },
            { key: 'to_email', header: 'To' },
            {
              key: 'subject',
              header: 'Subject',
              className: 'max-w-[min(28rem,50vw)]',
              render: (r) =>
                r.subject ? (
                  <span title={r.subject}>
                    {truncateWords(r.subject, SUBJECT_PREVIEW_WORDS)}
                  </span>
                ) : (
                  '—'
                ),
            },
            {
              key: 'template',
              header: 'Template',
              render: (r) => (r.template ? r.template : '—'),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <span
                  className={
                    r.status === 'failed'
                      ? 'font-medium text-destructive'
                      : 'font-medium text-emerald-600 dark:text-emerald-400'
                  }
                >
                  {r.status}
                </span>
              ),
            },
            {
              key: 'sent_at',
              header: 'Sent at',
              render: (r) => new Date(r.sent_at).toLocaleString(),
            },
            {
              key: 'actions',
              header: '',
              className: 'whitespace-nowrap',
              render: (r) => (
                <button
                  type="button"
                  onClick={() => setDetailLog(r)}
                  className="text-primary hover:underline"
                >
                  View
                </button>
              ),
            },
          ]}
          data={logs}
          keyExtractor={(r) => r.id}
          emptyMessage="No email log entries"
        />
      </div>
      <div className="mt-6">
        <Pagination
          page={pageFromUrl}
          pageSize={PAGE_SIZE}
          totalItems={total}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>

      <Modal
        open={detailLog != null}
        onClose={() => setDetailLog(null)}
        title={detailLog ? `Email #${detailLog.id}` : 'Email'}
        wide
      >
        {detailLog && (
          <dl className="grid gap-4 text-sm sm:grid-cols-[8rem_1fr] sm:gap-x-4 sm:gap-y-3">
            <dt className="font-medium text-muted-foreground">ID</dt>
            <dd>{detailLog.id}</dd>
            <dt className="font-medium text-muted-foreground">To</dt>
            <dd className="break-all">{detailLog.to_email}</dd>
            <dt className="font-medium text-muted-foreground">Subject</dt>
            <dd className="break-words whitespace-pre-wrap">{detailLog.subject ?? '—'}</dd>
            <dt className="font-medium text-muted-foreground">Template</dt>
            <dd>{detailLog.template ?? '—'}</dd>
            <dt className="font-medium text-muted-foreground">Status</dt>
            <dd>
              <span
                className={
                  detailLog.status === 'failed'
                    ? 'font-medium text-destructive'
                    : 'font-medium text-emerald-600 dark:text-emerald-400'
                }
              >
                {detailLog.status}
              </span>
            </dd>
            <dt className="font-medium text-muted-foreground">Error</dt>
            <dd className="break-words whitespace-pre-wrap">{detailLog.error_message ?? '—'}</dd>
            <dt className="font-medium text-muted-foreground">Sent at</dt>
            <dd>{new Date(detailLog.sent_at).toLocaleString()}</dd>
          </dl>
        )}
      </Modal>
    </div>
  );
}

export default function AdminEmailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AdminEmailsContent />
    </Suspense>
  );
}
