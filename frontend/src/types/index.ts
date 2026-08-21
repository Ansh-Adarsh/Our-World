// ─── Core Entity Types ────────────────────────────────────────────────────────

/**
 * Onboarding journey state machine (profiles.onboarding_status).
 * Server-authoritative — see supabase/migrations/005_onboarding_journey.sql.
 */
export type OnboardingStatus =
  | 'not_started'
  | 'questions_completed'
  | 'birthday_completed'
  | 'memories_completed'
  | 'completed';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  /** Absent until migration 005 is applied — treated as 'completed' when missing. */
  onboarding_status?: OnboardingStatus;
  /** Resume point inside the question game (0-based index). */
  onboarding_step?: number;
  onboarding_completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;
  couple_name: string | null;
  anniversary_date: string | null;
  partner_name?: string | null;
  partner_birthday?: string | null;
  invite_code?: string | null;
  partner_1_timezone?: string | null;
  partner_2_timezone?: string | null;
  partner_1_status?: string | null;
  partner_2_status?: string | null;
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

// ─── Phase 3 Entities ─────────────────────────────────────────────────────────

export type EventCategory = 'anniversary' | 'date_night' | 'trip' | 'milestone' | 'other';

export interface CoupleEvent {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  description: string | null;
  event_date: string;
  category: EventCategory;
  is_annual: boolean;
  created_at: string;
  updated_at: string;
}

export type MessageType = 'text' | 'heart' | 'photo' | 'voice_note';

export interface ChatMessage {
  id: string;
  couple_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  created_at: string;
  read_at?: string | null;
  sender_name?: string;
}

export interface PartnerPresence {
  userId: string;
  displayName: string;
  onlineAt: string;
  status?: string;
}

export interface PlaylistSong {
  id: string;
  couple_id: string;
  added_by_id: string;
  title: string;
  artist: string;
  link_url: string | null;
  storage_path?: string | null;
  audio_url?: string | null;
  note: string | null;
  created_at: string;
  updated_at?: string;
}

export interface GiftItem {
  id: string;
  couple_id: string;
  added_by_id: string;
  title: string;
  description: string | null;
  price_estimate: string | null;
  link_url: string | null;
  is_given: boolean;
  given_at: string | null;
  created_at: string;
}

export interface Quiz {
  id: string;
  couple_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  questions?: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
}

export interface QuizAnswer {
  id: string;
  quiz_id: string;
  question_id: string;
  user_id: string;
  selected_option: number;
  is_correct: boolean;
  answered_at: string;
}

export type UnderstandingStatus = 'open' | 'in_progress' | 'resolved';

export interface UnderstandingEntry {
  id: string;
  couple_id: string;
  author_id: string;
  topic: string;
  my_perspective: string;
  partner_perspective_summary: string | null;
  proposed_resolution: string | null;
  status: UnderstandingStatus;
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
  onboardingStatus: OnboardingStatus;
  onboardingStep: number;
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
