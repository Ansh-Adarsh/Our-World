import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:8000';

export interface AIGenerateRequest {
  intent: 'memory_caption' | 'love_letter' | 'quiz_suggestion' | 'story_narrative' | 'surprise_idea' | 'birthday_experience';
  context?: Record<string, unknown>;
}

export interface AIGenerateResponse {
  intent: string;
  draft_content: string;
  requires_approval: boolean;
  agent_name: string;
}

export async function generateAIContent(req: AIGenerateRequest): Promise<AIGenerateResponse> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(`${API_BASE}/api/v1/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'AI Request failed' }));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('[AIService] Backend AI note, using offline fallback:', err);
    return getOfflineFallback(req);
  }
}

function getOfflineFallback(req: AIGenerateRequest): AIGenerateResponse {
  const intent = req.intent;
  let draft = "Golden hour moments with you are my absolute favorite place to be. ❤️✨";

  if (intent === 'love_letter') {
    draft = "My dearest, sitting down to write this reminds me of how grateful I am for us. Every quiet morning and laughing evening with you makes our little world feel complete. ❤️";
  } else if (intent === 'quiz_suggestion') {
    draft = "What is our absolute favorite weekend ritual?";
  } else if (intent === 'story_narrative') {
    draft = "It all started with a quiet coffee date under the soft afternoon sun. From rainy cafe afternoons to golden hour walks by the water, every chapter of our story feels like a dream.";
  } else if (intent === 'surprise_idea') {
    draft = "A romantic surprise idea: Pack a cozy blanket, hot tea, and watch the stars from a quiet spot tonight. ✨";
  }

  return {
    intent,
    draft_content: draft,
    requires_approval: true,
    agent_name: 'OfflineFallbackAgent',
  };
}
