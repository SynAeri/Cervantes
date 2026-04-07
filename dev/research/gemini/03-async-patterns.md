# Gemini API Async Patterns & FastAPI Integration

> Research date: 2026-04-04
> Sources:
> - https://googleapis.github.io/python-genai/
> - https://www.mintlify.com/googleapis/python-genai/api/async-client
> - https://dev.to/subramanyaks/your-first-steps-to-ai-gemini-api-with-fastapi-1doh
> - https://medium.com/google-cloud/how-to-prompt-gemini-asynchronously-using-python-on-google-cloud-986ca45d9f1b
> - https://github.com/googleapis/python-genai (issues #930, #1989, #1990)

## Async Client in the New SDK

The new `google-genai` SDK provides async operations through `client.aio`:

```python
from google import genai

client = genai.Client()

# Async generate content
response = await client.aio.models.generate_content(
    model="gemini-2.5-flash",
    contents="Your prompt here"
)
print(response.text)
```

### Context Manager Pattern

```python
# Recommended for web applications
async with genai.Client().aio as aclient:
    response = await aclient.models.generate_content(
        model="gemini-2.5-flash",
        contents="Hello"
    )
```

Or explicit cleanup:
```python
client = genai.Client()
try:
    response = await client.aio.models.generate_content(...)
finally:
    await client.aio.aclose()
```

## Async Streaming

```python
async for chunk in await client.aio.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents="Tell me a long story"
):
    print(chunk.text, end="")
```

## FastAPI Integration Patterns

### Pattern 1: Global Client (recommended)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from google import genai
from google.genai import types

# Global client instance
gemini_client: genai.Client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global gemini_client
    gemini_client = genai.Client()
    yield
    # Cleanup on shutdown
    await gemini_client.aio.aclose()

app = FastAPI(lifespan=lifespan)

@app.post("/generate")
async def generate(prompt: str):
    response = await gemini_client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.7,
            system_instruction="You are a helpful assistant."
        )
    )
    return {"text": response.text}
```

### Pattern 2: Streaming Response with FastAPI

```python
from fastapi.responses import StreamingResponse

@app.post("/stream")
async def stream_generate(prompt: str):
    async def event_stream():
        async for chunk in await gemini_client.aio.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=prompt
        ):
            if chunk.text:
                yield f"data: {chunk.text}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

### Pattern 3: Concurrent Requests

```python
import asyncio

async def generate_multiple(prompts: list[str]):
    tasks = [
        gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        for prompt in prompts
    ]
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    return [
        r.text if not isinstance(r, Exception) else str(r)
        for r in responses
    ]
```

### Pattern 4: Retry with tenacity (preserving Cervantes pattern)

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((ResourceExhausted, ServiceUnavailable))
)
async def generate_with_retry(
    client: genai.Client,
    model: str,
    contents: str,
    config: types.GenerateContentConfig
):
    return await client.aio.models.generate_content(
        model=model,
        contents=contents,
        config=config
    )
```

**Note:** Be specific about which exceptions to retry. The current Cervantes code retries on ALL exceptions (`retry_if_exception_type((Exception,))`), which is too broad -- it will retry on schema validation errors and other non-transient failures.

Recommended exceptions to retry:
- `google.api_core.exceptions.ResourceExhausted` (429 rate limiting)
- `google.api_core.exceptions.ServiceUnavailable` (503)
- `google.api_core.exceptions.InternalServerError` (500)
- `google.api_core.exceptions.DeadlineExceeded` (timeout)

## Async Chat Sessions

```python
# Async multi-turn chat
chat = client.aio.chats.create(
    model="gemini-2.5-flash",
    config=types.GenerateContentConfig(
        system_instruction="You are a Socratic tutor."
    )
)

response1 = await chat.send_message(message="What is supply and demand?")
response2 = await chat.send_message(message="Can you give an example?")
```

## Known Async Issues (from GitHub)

### Issue #1990: `BaseApiClient` attribute error
`'BaseApiClient' object has no attribute '_async_client_session_request_args'` -- occurs in certain initialization patterns. Use context manager to avoid.

### Issue #1989: aiohttp deprecation warning
`DeprecationWarning: Inheritance class AiohttpClientSession from ClientSession is discouraged` -- cosmetic warning, does not affect functionality.

### Issue #930: Feature request for aiohttp in async APIs
Request to use `aiohttp` for lower latency in async operations. This is an ongoing improvement area.

### Issue #1724: Async finalizer fix
`__del__` finalizers removed from async clients to prevent unawaited coroutine warnings. Ensure you call `aclose()` explicitly or use context managers.

## Cervantes-Specific Recommendations

1. **Create the client once** in FastAPI lifespan, not per-request
2. **Use `client.aio.models.generate_content()`** instead of `model.generate_content_async()`
3. **Pass system instructions via `config`** instead of concatenating with user prompt
4. **Narrow retry exceptions** to transient errors only (rate limits, server errors)
5. **Use `asyncio.gather()`** for parallel scene generation if multiple scenes need generating
6. **Consider streaming** for long scene content generation to improve perceived latency
