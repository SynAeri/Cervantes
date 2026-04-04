# Gemini API wrapper using google-genai SDK (replaces deprecated google-generativeai)
# Supports structured JSON output, proper system instructions, and async

import json
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.backend.core.config import settings

# Create client once at module level
client = genai.Client(api_key=settings.GEMINI_API_KEY)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((ConnectionError, TimeoutError, OSError))
)
async def generate_structured(
    system: str,
    user: str,
    response_format: str = "json",
    model: str | None = None,
    temperature: float = 0.7,
    response_schema: type | None = None,
) -> dict | str:
    model = model or settings.GEMINI_MODEL

    config = types.GenerateContentConfig(
        temperature=temperature,
        system_instruction=system,
        response_mime_type="application/json" if response_format == "json" else "text/plain",
    )

    if response_schema and response_format == "json":
        config.response_schema = response_schema

    response = await client.aio.models.generate_content(
        model=model,
        contents=user,
        config=config,
    )

    text = response.text

    if response_format == "json":
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM JSON response: {e}\nResponse: {text[:500]}")

    return text


async def generate_with_retry(
    system: str,
    user: str,
    response_format: str = "json",
    model: str | None = None,
    temperature: float = 0.7,
    response_schema: type | None = None,
) -> dict | str:
    return await generate_structured(
        system=system,
        user=user,
        response_format=response_format,
        model=model,
        temperature=temperature,
        response_schema=response_schema,
    )
