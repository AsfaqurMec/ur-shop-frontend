import { z } from 'zod';

export const checkoutSchema = z.object({
  coupon_code: z.string().max(64).optional().or(z.literal('')),
});

export const paymentProofSchema = z.object({
  /** Kept in parsed output so submit handler receives the file (Zod strips unknown keys). */
  proof: z
    .custom<FileList | undefined>(
      (val) => val === undefined || (typeof FileList !== 'undefined' && val instanceof FileList)
    )
    .optional(),
  sender_number: z.string().max(64).optional().or(z.literal('')),
  transaction_id: z.string().max(128).optional().or(z.literal('')),
  paid_amount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || (typeof v === 'number' && v >= 0), {
      message: 'Must be a non-negative number',
    }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
