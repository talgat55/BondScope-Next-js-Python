"""
Mistral AI chat client with timeouts and error mapping.
"""
from concurrent.futures import TimeoutError as FuturesTimeoutError
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from mistralai.client import MistralClient

DEFAULT_TIMEOUT_SEC = 60


def _map_error(e: Exception) -> str:
    msg = str(e).lower()
    if "401" in msg or "unauthorized" in msg:
        return "Invalid MISTRAL_API_KEY"
    if "429" in msg or "rate" in msg:
        return "Rate limited by Mistral"
    return "Mistral service unavailable"


def mistral_chat(
    messages: list[dict[str, Any]],
    model: str,
    *,
    temperature: float = 0.2,
    max_tokens: int = 600,
    api_key: str | None = None,
    timeout_sec: float = DEFAULT_TIMEOUT_SEC,
) -> str:
    """
    Call Mistral chat completion. Returns content string or raises ValueError with
    a user-facing message (Invalid MISTRAL_API_KEY, Rate limited, service unavailable).
    """
    if not api_key or not api_key.strip():
        raise ValueError("Invalid MISTRAL_API_KEY")
    client = MistralClient(api_key=api_key.strip())
    try:
        with ThreadPoolExecutor(max_workers=1) as ex:
            future = ex.submit(
                lambda: client.chat(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            )
            response = future.result(timeout=timeout_sec)
    except FuturesTimeoutError:
        raise ValueError("Mistral service unavailable") from None
    except Exception as e:
        raise ValueError(_map_error(e)) from e
    if not response.choices:
        raise ValueError("Mistral service unavailable")
    content = response.choices[0].message.content
    return content or ""
