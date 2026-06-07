interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  open: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  answered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  customer_reply: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  pending_activation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  expired: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200',
  verified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = statusStyles[status] ?? 'bg-muted text-muted-foreground';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
