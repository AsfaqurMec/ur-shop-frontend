export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  banner_image: string | null;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
