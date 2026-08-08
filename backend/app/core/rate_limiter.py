"""
In-memory sliding window rate limiter for AI endpoints.
Limits AI calls per user to prevent abuse and API cost overruns.
"""
import time
from collections import defaultdict
from typing import Dict, List

from fastapi import HTTPException, status

# Default limit: max 10 requests per user per 60 seconds
DEFAULT_RATE_LIMIT = 10
WINDOW_SECONDS = 60

_user_requests: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(user_id: str, limit: int = DEFAULT_RATE_LIMIT, window: int = WINDOW_SECONDS) -> None:
    """
    Checks if the user has exceeded the allowable request count in the window.
    Raises HTTP 429 if rate limit is exceeded.
    """
    now = time.time()
    cutoff = now - window

    # Clean out timestamps older than cutoff
    timestamps = [t for t in _user_requests[user_id] if t > cutoff]
    _user_requests[user_id] = timestamps

    if len(timestamps) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {limit} AI requests per {window} seconds allowed.",
        )

    # Record current request
    _user_requests[user_id].append(now)
