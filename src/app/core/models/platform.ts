export interface GameProject {
  id: number;
  title: string;
  slug: string;
  owner: string;
  cover: string;
  data?: string;
  released: boolean;
  listing_slug: string;
  in_library: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface MarketplaceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface MarketplaceTag {
  name: string;
  count: number;
}

export interface MarketplaceGameCard {
  id: number;
  title: string;
  slug: string;
  cover: string;
  owner: string;
}

export interface MarketplaceReview {
  username: string;
  stars: number;
  comment: string;
}

export interface MarketplaceListing {
  id: number;
  slug: string;
  description: string;
  price_cents: number;
  currency: string;
  category: { slug: string; name: string };
  tags: string[];
  game: MarketplaceGameCard;
  published: boolean;
  owned: boolean;
  in_library: boolean;
  rating_average: number | null;
  rating_count: number;
  my_rating: number | null;
  reviews: MarketplaceReview[];
  created_at: string;
  updated_at: string;
}

export interface MarketplacePurchase {
  id: number;
  status: 'pending' | 'paid' | 'refunded' | 'disputed' | 'canceled' | 'failed';
  title: string;
  price_cents: number;
  currency: string;
  platform_fee_cents: number;
  processing_estimate_cents: number;
  creator_credit_cents: number;
  seller: string;
  buyer: string;
  cover: string;
  listing_slug: string;
  game_id: number | null;
  paid_at: string | null;
  available_at: string | null;
  created_at: string;
}

export interface MarketplaceCheckout {
  free: boolean;
  checkout_url: string;
  session_id: string;
  purchase: MarketplacePurchase;
}

export interface MarketplaceAccount {
  stripe_account_id: string;
  transfers_status: string;
  payouts_status: string;
  ready: boolean;
}

export interface MarketplaceBalance {
  held_cents: number;
  available_cents: number;
  paid_out_cents: number;
  min_payout_cents: number;
  hold_days: number;
}

export interface MarketplacePayout {
  transferred: boolean;
  amount_cents: number;
  payout_id: number | null;
  blocked_reason: string;
}

export interface MarketplaceSellerGame {
  id: number;
  title: string;
  slug: string;
  listing_slug: string;
}

export interface MarketplaceSales {
  balance: MarketplaceBalance;
  payout: MarketplacePayout;
  account: MarketplaceAccount;
  listings: MarketplaceListing[];
  games: MarketplaceSellerGame[];
  sales: MarketplacePurchase[];
}

export interface MarketplaceAccountSession {
  client_secret: string;
  publishable_key: string;
  components: string[];
}

export interface MarketplaceConfig {
  currency: string;
  min_paid_cents: number;
  min_payout_cents: number;
  hold_days: number;
  platform_fee_bps: number;
  processing_fee_bps: number;
  processing_fee_fixed_cents: number;
  stripe_publishable_key: string;
}
