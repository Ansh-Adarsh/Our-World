"""
Groq API Integration Client.

🔒 SECURITY & PRIVACY MANDATE:
- Invoked ONLY from FastAPI backend.
- Prompts use DATA MINIMIZATION — only specific context fields are passed.
- Never accepts or sends full database dumps or credentials.
"""
import logging
from typing import Dict, Any, Optional
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


async def call_groq_llm(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.7,
    max_tokens: int = 500,
) -> str:
    """
    Executes a chat completion call to Groq API.
    Falls back gracefully to mock responses if Groq API key is unconfigured or call fails.
    """
    settings = get_settings()

    if not settings.groq_api_key:
        logger.warning("[GroqClient] GROQ_API_KEY not configured — returning fallback structured mock")
        return generate_mock_fallback(system_prompt, user_prompt)

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(GROQ_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        logger.error("[GroqClient] LLM call failed: %s — using fallback", type(exc).__name__)
        return generate_mock_fallback(system_prompt, user_prompt)


def generate_mock_fallback(system_prompt: str, user_prompt: str) -> str:
    """Provides warm, romantic, fallback content when Groq API key is offline."""
    user_lower = user_prompt.lower()

    if "caption" in system_prompt.lower() or "caption" in user_lower:
        return "Golden hour moments with you are my absolute favorite place to be. ❤️✨"

    if "letter" in system_prompt.lower() or "love" in user_lower:
        return (
          "My dearest, sitting down to write this reminds me of how grateful I am for us. "
          "Every quiet morning and laughing evening with you makes our little world feel complete. ❤️"
        )

    if "quiz" in system_prompt.lower() or "trivia" in user_lower:
        return '{"question": "What is our absolute favorite weekend ritual?", "options": ["Coffee on the balcony", "Late night movie marathon", "Sunset walks", "Cooking dinner together"], "correct_index": 0}'

    if "story" in system_prompt.lower() or "narrative" in user_lower:
        return (
          "It all started with a quiet coffee date under the soft afternoon sun. "
          "From rainy cafe afternoons to golden hour walks by the water, every chapter of our story feels like a dream."
        )

    return "A romantic surprise idea: Pack a cozy blanket, hot tea, and watch the stars from a quiet spot tonight. ✨"
