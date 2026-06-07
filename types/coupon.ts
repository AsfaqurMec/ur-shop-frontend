export type CouponType = 'percentage' | 'fixed_amount';

export interface CouponPublic {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  coupon?: CouponPublic;
  discount_amount?: number;
  eligible_subtotal?: number;
}
