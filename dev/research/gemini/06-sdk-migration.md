# SDK Migration: google-generativeai -> google-genai

> Research date: 2026-04-04
> Sources:
> - https://ai.google.dev/gemini-api/docs/migrate
> - https://medium.com/google-cloud/migrating-to-the-new-google-gen-ai-sdk-python-074d583c2350
> - https://github.com/google-gemini/deprecated-generative-ai-python
> - https://github.com/googleapis/python-genai
> - https://googleapis.github.io/python-genai/

## Why Migrate?

- `google-generativeai` support ended **November 30, 2025**
- The repo is archived as `google-gemini/deprecated-generative-ai-python`
- No access to Gemini 2.5+, 3.x models
- No access to new features (Live API, improved structured output, etc.)
- No bug fixes or security patches

## Installation Change

```diff
- google-generativeai
+ google-genai
```

In `requirements.txt`:
```
google-genai
```

## Migration Mapping for Cervantes

### Architecture Change: Model Objects -> Client

**Old (current Cervantes pattern):**
```python
import google.generativeai as genai

# Global configuration
genai.configure(api_key=settings.GEMINI_API_KEY)

# Per-call model creation
model_obj = genai.GenerativeModel(
    model_name="gemini-2.0-flash-exp",
    generation_config={
        "temperature": 0.7,
        "response_mime_type": "application/json"
    }
)

response = await model_obj.generate_content_async(prompt)
```

**New (target pattern):**
```python
from google import genai
from google.genai import types

# Create client once (in FastAPI lifespan or module level)
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Per-call generation
response = await client.aio.models.generate_content(
    model="gemini-2.5-flash",
    contents=user_prompt,
    config=types.GenerateContentConfig(
        temperature=0.7,
        system_instruction=system_prompt,
        response_mime_type="application/json",
        response_schema=MyPydanticModel  # Optional but recommended
    )
)
```

### Complete `llm_client.py` Migration

**Current code:**
```python
import json
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.backend.core.config import settings

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
```

**Migrated code:**
```python
import json
from google import genai
from google.genai import types
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, InternalServerError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.backend.core.config import settings

# Create client once at module level
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Retry only on transient errors
RETRYABLE_EXCEPTIONS = (ResourceExhausted, ServiceUnavailable, InternalServerError)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(RETRYABLE_EXCEPTIONS)
)
async def generate_structured(
    system: str,
    user: str,
    response_format: str = "json",
    model: str = "gemini-2.5-flash",
    temperature: float = 0.7,
    response_schema: type | None = None,
) -> dict | str:
    config = types.GenerateContentConfig(
        temperature=temperature,
        system_instruction=system,
        response_mime_type="application/json" if response_format == "json" else "text/plain",
    )

    # If a Pydantic schema is provided, use schema-constrained output
    if response_schema and response_format == "json":
        config.response_schema = response_schema

    response = await client.aio.models.generate_content(
        model=model,
        contents=user,
        config=config,
    )

    if response_format == "json":
        # Prefer .parsed if schema was provided
        if response_schema and response.parsed:
            return response.parsed
        try:
            return json.loads(response.text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM JSON response: {e}\nResponse: {response.text[:500]}")

    return response.text


async def generate_with_retry(
    system: str,
    user: str,
    response_format: str = "json",
    model: str = "gemini-2.5-flash",
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
```

### Key API Differences Table

| Feature | Old (`google-generativeai`) | New (`google-genai`) |
|---------|---------------------------|---------------------|
| Import | `import google.generativeai as genai` | `from google import genai` |
| Auth | `genai.configure(api_key=...)` | `client = genai.Client(api_key=...)` |
| Model | `genai.GenerativeModel(model_name=...)` | Pass model as string parameter |
| Gen config | Dict in `GenerativeModel()` constructor | `types.GenerateContentConfig(...)` |
| System prompt | Concatenated with user prompt (hack) | `system_instruction` in config |
| Sync generate | `model.generate_content(...)` | `client.models.generate_content(...)` |
| Async generate | `model.generate_content_async(...)` | `client.aio.models.generate_content(...)` |
| Streaming | `model.generate_content(..., stream=True)` | `client.models.generate_content_stream(...)` |
| JSON schema | `response_mime_type` + manual parsing | `response_schema` + `.parsed` |
| Chat | `model.start_chat()` | `client.chats.create(model=...)` |
| Files | `genai.upload_file()` | `client.files.upload()` |
| Token count | `model.count_tokens()` | `client.models.count_tokens()` |

### Files That Need Changes

1. **`app/backend/requirements.txt`**
   - Replace `google-generativeai` with `google-genai`

2. **`app/backend/core/llm_client.py`**
   - Full rewrite (see migrated code above)

3. **`app/backend/features/arc/service.py`**
   - Update model references from `gemini-2.0-flash-exp` to `gemini-2.5-flash`
   - Optionally pass Pydantic schemas (`CurriculumData`, `NarrativeArc`) as `response_schema`

4. **`app/backend/features/dialogue/service.py`**
   - Update model references
   - Review for any direct SDK usage

5. **`app/backend/features/signal_extraction/service.py`**
   - Update model references
   - Review for any direct SDK usage

6. **`app/backend/core/config.py`**
   - Add `GEMINI_MODEL` setting for configurable model name

### Migration Checklist

- [ ] Update `requirements.txt`: `google-generativeai` -> `google-genai`
- [ ] Rewrite `llm_client.py` with new client pattern
- [ ] Add `GEMINI_MODEL` to config/settings
- [ ] Replace all `gemini-2.0-flash-exp` references with config value
- [ ] Separate system instructions from user prompts (remove string concat hack)
- [ ] Add Pydantic `response_schema` for JSON endpoints where schemas exist
- [ ] Narrow retry exceptions to transient errors only
- [ ] Test all three services: arc, dialogue, signal_extraction
- [ ] Verify JSON parsing still works with new SDK
- [ ] Update any environment variable names if needed (`GEMINI_API_KEY` stays the same)

### Breaking Changes to Watch For

1. **Response object structure** may differ -- test `.text` and `.parsed` access
2. **Error types** change -- `google.api_core.exceptions` instead of generic exceptions
3. **Automatic function calling** is ON by default in the new SDK -- disable if not wanted
4. **`GenerativeModel` no longer exists** -- all config is per-call via `GenerateContentConfig`
5. **Pydantic v2 required** -- the new SDK uses Pydantic v2 types throughout
