export type ReviewStatus = 'pending' | 'approved';

/** Public review on the storefront (not hidden by admin). */
export interface ProductReviewPublic {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

/** Review detail after submit/update (includes moderation status). */
export interface ProductReviewDetail {
  id: number;
  product_id: number;
  product_name: string;
  user_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  is_hidden: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

/** Admin moderation list item (all statuses; includes hidden). */
export interface ProductReviewAdmin {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  is_hidden: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

/** Admin reviews table (product + category). */
export interface ProductReviewAdminTableRow extends ProductReviewAdmin {
  product_name: string;
  product_slug: string;
  category_id: number | null;
  category_name: string | null;
}
