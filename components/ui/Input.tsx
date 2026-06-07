import { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => (
    <input
      ref={ref}
      className={`
        flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm
        placeholder:text-muted-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        transition-shadow
        ${error ? 'border-destructive focus-visible:ring-destructive' : 'border-input'}
        ${className}
      `}
      {...props}
    />
  )
);

Input.displayName = 'Input';
