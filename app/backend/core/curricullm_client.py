# CurricuLLM API client - OpenAI-compatible endpoint
# Uses openai SDK with custom base_url pointing to api.curricullm.com/v1
# Models: CurricuLLM-AU, CurricuLLM-AU-VIC, CurricuLLM-AU-WA, CurricuLLM-NZ

import json
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from app.backend.core.config import settings

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.CURRICULLM_API_KEY,
            base_url=settings.CURRICULLM_BASE_URL,
        )
    return _client


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=15),
)
async def generate_curriculum_analysis(
    system: str,
    user: str,
    model: str | None = None,
    temperature: float = 0.3,
    response_format: str = "json",
    max_tokens: int = 8192,
) -> dict | str:
    """
    Send a prompt to CurricuLLM for curriculum-aligned analysis.
    Returns parsed JSON dict or raw text.
    """
    client = get_client()
    model = model or settings.CURRICULLM_MODEL

    kwargs = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if response_format == "json":
        kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**kwargs)
    text = response.choices[0].message.content

    if response_format == "json":
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            # Try to fix common JSON truncation issues
            if text.endswith('"') and not text.endswith('"}'):
                # Truncated in the middle of a string value
                text = text + '"]}'
            elif not text.endswith('}'):
                # Missing closing braces
                open_braces = text.count('{') - text.count('}')
                text = text + ('}' * open_braces)

            # Try again
            try:
                return json.loads(text)
            except:
                raise ValueError(f"CurricuLLM JSON parse failed: {e}\nResponse: {text[:1000]}")

    return text
