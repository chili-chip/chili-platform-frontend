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
