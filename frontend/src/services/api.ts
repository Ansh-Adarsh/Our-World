/**
 * API service — communicates with the FastAPI backend.
 *
 * The backend holds all sensitive credentials (Groq, service-role key, etc.)
 * The frontend only talks to backend endpoints, never to AI providers directly.
 */
import { supabase } from './supabase';
import type { CreateCoupleResponse } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:8000';

// ─── Helper: get current session token ────────────────────────────────────────
async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Helper: base fetch wrapper ────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeader = await getAuthHeader();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorBody.detail || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ─── Health check ─────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch('/health');
}

// ─── Couples ──────────────────────────────────────────────────────────────────
export async function createCouple(params?: {
  couple_name?: string;
  anniversary_date?: string;
}): Promise<CreateCoupleResponse> {
  return apiFetch('/api/v1/couples', {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}
