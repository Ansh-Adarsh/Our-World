// ─── Core Entity Types ────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;
  couple_name: string | null;
  anniversary_date: string | null;
  partner_name?: string | null;
  partner_birthday?: string | null;
  onboarding_completed?: boolean;
  partner_1_id: string | null;
  partner_2_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoupleMember {
  id: string;
  couple_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
}

export interface OnboardingAnswer {
  id: string;
  couple_id: string;
  user_id: string;
  question_key: string;
  answer_text: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  description: string | null;
  memory_date: string;
  location: string | null;
  tags: string[];
  photos?: MemoryPhoto[];
  created_at: string;
  updated_at: string;
}

export interface MemoryPhoto {
  id: string;
  memory_id: string;
  couple_id: string;
  storage_path: string;
  signed_url?: string;
  caption: string | null;
  created_at: string;
}

export type DiaryVisibility = 'PRIVATE' | 'SHARED';

export interface DiaryEntry {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  content: string;
  mood: string | null;
  visibility: DiaryVisibility;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string | undefined;
  profile: Profile | null;
}

export interface AuthState {
  user: AuthUser | null;
  couple: Couple | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface CreateCoupleResponse {
  couple_id: string;
  message: string;
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'ghost' | 'gold' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
