# Gemini API wrapper with retry logic and structured output support

import json
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.backend.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((Exception,))
)
async def generate_structured(
    system: str,
    user: str,
    response_format: str = "json",
    model: str = "gemini-2.0-flash-exp",
    temperature: float = 0.7
) -> dict | str:
    model_obj = genai.GenerativeModel(
        model_name=model,
        generation_config={
            "temperature": temperature,
            "response_mime_type": "application/json" if response_format == "json" else "text/plain"
        }
    )

    prompt = f"{system}\n\n{user}"

    response = await model_obj.generate_content_async(prompt)
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
    model: str = "gemini-2.0-flash-exp",
    temperature: float = 0.7
) -> dict | str:
    return await generate_structured(
        system=system,
        user=user,
        response_format=response_format,
        model=model,
        temperature=temperature
    )
