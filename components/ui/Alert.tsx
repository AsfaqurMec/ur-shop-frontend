import { forwardRef } from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success';
}

const variants = {
  default: 'bg-muted text-foreground border-border',
  destructive: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-800',
  success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-800',
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={`rounded-lg border p-4 ${variants[variant]} ${className}`}
      {...props}
    />
  )
);

Alert.displayName = 'Alert';

export const AlertTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <h5 ref={ref} className={`mb-1 font-medium leading-none ${className}`} {...props} />
  )
);

AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p ref={ref} className={`text-sm opacity-90 ${className}`} {...props} />
  )
);

AlertDescription.displayName = 'AlertDescription';
