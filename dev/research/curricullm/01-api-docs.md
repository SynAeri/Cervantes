# CurricuLLM API Documentation

Research date: 2026-04-04

## Base URL

```
https://api.curricullm.com/v1
```

## Authentication

API key-based authentication. The key prefix is `sk_` (e.g. `sk_bbzzSR_8ugTM6ZipfzJvUEnEl39pIpv`).

Keys are managed in the Developer Playground at https://console.curricullm.com/.

## API Format: OpenAI-Compatible

CurricuLLM exposes an **OpenAI-compliant API**. This means you use the standard OpenAI client libraries (Python `openai`, JS `openai`) and simply override the base URL and API key.

### Python Example

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk_bbzzSR_8ugTM6ZipfzJvUEnEl39pIpv",
    base_url="https://api.curricullm.com/v1"
)

response = client.chat.completions.create(
    model="CurricuLLM-AU",
    messages=[
        {"role": "system", "content": "You are a curriculum analysis assistant..."},
        {"role": "user", "content": "Parse this rubric..."}
    ],
    response_format={"type": "json_object"},
    temperature=0.3
)

print(response.choices[0].message.content)
```

### JavaScript Example (from their docs)

```javascript
const openai = new OpenAI({
    apiKey: "your-curricullm-api-key",
    baseURL: "https://api.curricullm.com/v1"
});
```

## Endpoints (Inferred from OpenAI Compatibility)

Since the API is OpenAI-compliant, the following endpoints should be available:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/chat/completions` | POST | Main inference endpoint (confirmed by OpenAI compat) |
| `/v1/models` | GET | List available models (likely) |

There is **no separate rubric-parsing endpoint**. You use `/chat/completions` with appropriate system prompts, exactly as the project currently does with Gemini.

## Available Models

| Model ID | Focus | Cost (units) |
|----------|-------|---------------|
| `CurricuLLM-AU` | Australian Curriculum v9 | 6 |
| `CurricuLLM-AU-VIC` | Victorian Curriculum | 3 |
| `CurricuLLM-AU-WA` | Western Australia Curriculum | 4 |
| `CurricuLLM-NZ` | New Zealand Curriculum | 5 |

## Token Pricing

| Token Type | Cost |
|------------|------|
| Input tokens | $2 per million |
| Output tokens | $8 per million |
| Curriculum tokens | $2 per million |

"Curriculum tokens" are automatically used when the model references its embedded curriculum knowledge. They appear as a separate line item.

## Request/Response Format

Standard OpenAI chat completions format:

### Request

```json
{
    "model": "CurricuLLM-AU",
    "messages": [
        {"role": "system", "content": "..."},
        {"role": "user", "content": "..."}
    ],
    "temperature": 0.3,
    "response_format": {"type": "json_object"}
}
```

### Response

```json
{
    "id": "chatcmpl-...",
    "object": "chat.completion",
    "model": "CurricuLLM-AU",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "{...structured JSON...}"
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 150,
        "completion_tokens": 400,
        "total_tokens": 550
    }
}
```

## Rate Limits

No rate limit information was found in their public documentation. This should be tested empirically or asked about at `hello@curricullm.com`.

## Developer Console Features

At https://console.curricullm.com/:
- Chat interface for testing models
- API key management (create, rotate, revoke)
- Billing management
- Usage tracking and token consumption analytics

## Sources Searched

| URL | Result |
|-----|--------|
| https://curricullm.com/developers | Main dev page - confirmed base URL, OpenAI compat, pricing, code example |
| https://console.curricullm.com/ | API Playground - confirmed models, pricing tiers, key management |
| https://curricullm.com/ | Main site - confirmed curriculum coverage, features |
| Google: "CurricuLLM API documentation developer" | Found dev page and console |
| Google: "curricullm.com developers API endpoints" | Found console link |
| Google: "api.curricullm.com" integration tutorial | No detailed tutorial found |
| Google: "CurricuLLM API rate limits credits" | No rate limit info found |
