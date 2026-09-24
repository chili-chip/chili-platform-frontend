export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  avatar_url: string;
  bio: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse extends AuthTokens {
  user: UserProfile;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  post_count?: number;
}

export interface ForumPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  author: {
    id: number;
    username: string;
    avatar_url: string;
  };
  category: number;
  category_detail?: ForumCategory;
  comment_count?: number;
  created_at: string;
}

export interface ForumComment {
  id: number;
  post: number;
  author: {
    id: number;
    username: string;
    avatar_url: string;
  };
  content: string;
  created_at: string;
}

export interface StoreProductImage {
  id: number;
  url: string;
  alt: string;
  sort_order: number;
}

export interface StoreProduct {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  long_description: string;
  description?: string;
  sku: string;
  price_cents: number;
  currency: string;
  images?: StoreProductImage[];
  image_url?: string;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StoreOrderStatus = 'pending' | 'paid' | 'canceled' | 'failed' | 'fulfilled';
export type StoreShippingStatus = 'awaiting_payment' | 'preparing' | 'shipped' | 'not_shipping';

export interface StoreOrderItem {
  id: number;
  product: number;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
}

export interface StoreOrder {
  id: number;
  status: StoreOrderStatus;
  shipping_status?: StoreShippingStatus;
  currency: string;
  total_cents: number;
  stripe_checkout_session_id: string | null;
  customer_email: string;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  items: StoreOrderItem[];
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface StoreCheckoutSession {
  checkout_url: string;
  session_id: string;
  order: StoreOrder;
}

export interface CartLine {
  product: StoreProduct;
  quantity: number;
}
