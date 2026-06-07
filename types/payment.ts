export interface BankTransferDetails {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  routing_number?: string | null;
  iban?: string | null;
  swift_bic?: string | null;
  payment_reference_hint?: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  gateway: string;
  bank_details?: BankTransferDetails | null;
  kind?: 'manual' | 'merchant';
  manual_flow?: 'mfs_reference' | 'bank_proof' | null;
  ui_brand?: string | null;
}

export type PaymentProofStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentProof {
  id: number;
  order_id: number;
  sender_number: string | null;
  transaction_id: string | null;
  paid_amount: number | null;
  file_path: string | null;
  status: PaymentProofStatus;
  created_at: string;
  updated_at: string;
}
