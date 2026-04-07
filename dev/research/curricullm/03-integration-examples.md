# CurricuLLM Integration Examples

Research date: 2026-04-04

## SDK / Package

**No dedicated CurricuLLM SDK exists.** There is no `curricullm` package on PyPI or npm.

Since the API is OpenAI-compatible, you use the standard OpenAI client library:

```bash
pip install openai
```

## Python Integration (for Cervantes FastAPI backend)

### Basic Chat Completion

```python
from openai import AsyncOpenAI

curricullm_client = AsyncOpenAI(
    api_key="sk_bbzzSR_8ugTM6ZipfzJvUEnEl39pIpv",
    base_url="https://api.curricullm.com/v1"
)

async def parse_rubric(rubric_text: str) -> dict:
    response = await curricullm_client.chat.completions.create(
        model="CurricuLLM-AU",
        messages=[
            {
                "role": "system",
                "content": "You are a curriculum analysis assistant specialising in the Australian Curriculum..."
            },
            {
                "role": "user",
                "content": f"Here are the assessment materials for parsing:\n\n---\n{rubric_text}\n---\n\nExtract the structured assessment summary as JSON."
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.3
    )
    
    import json
    return json.loads(response.choices[0].message.content)
```

### Integration into Cervantes Service Layer

The current `app/backend/core/llm_client.py` uses the `google.generativeai` library directly. To integrate CurricuLLM, you would:

1. Add a CurricuLLM client alongside the existing Gemini client
2. Route Phase 1 (rubric parsing) through CurricuLLM
3. Keep Phase 2 (scene generation) on Gemini

```python
# Proposed addition to llm_client.py or a new curricullm_client.py

from openai import AsyncOpenAI
from app.backend.core.config import settings

curricullm_client = AsyncOpenAI(
    api_key=settings.CURRICULLM_API_KEY,
    base_url="https://api.curricullm.com/v1"
)

async def curricullm_generate(
    system: str,
    user: str,
    model: str = "CurricuLLM-AU",
    temperature: float = 0.3,
    response_format: str = "json"
) -> dict | str:
    """Call CurricuLLM API for curriculum-grounded tasks."""
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user}
    ]
    
    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    
    if response_format == "json":
        kwargs["response_format"] = {"type": "json_object"}
    
    response = await curricullm_client.chat.completions.create(**kwargs)
    text = response.choices[0].message.content
    
    if response_format == "json":
        import json
        return json.loads(text)
    return text
```

### Service Layer Change (arc/service.py)

```python
# Change Phase 1 from:
curriculum_data_dict = await llm_client.generate_with_retry(
    system=curriculum_prompt,
    user=f"Here are the assessment materials...",
    response_format="json",
    model="gemini-2.0-flash-exp",  # <-- currently using Gemini
    temperature=0.3
)

# To:
curriculum_data_dict = await curricullm_client.curricullm_generate(
    system=curriculum_prompt,
    user=f"Here are the assessment materials...",
    model="CurricuLLM-AU",  # <-- real CurricuLLM model
    temperature=0.3
)
```

## JavaScript Example (from CurricuLLM docs)

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: "your-curricullm-api-key",
    baseURL: "https://api.curricullm.com/v1"
});

const response = await client.chat.completions.create({
    model: "CurricuLLM-AU",
    messages: [
        { role: "system", content: "You are a curriculum analysis assistant..." },
        { role: "user", content: "Parse this rubric..." }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
});
```

## Hackathon References

- **Cambridge EduX Hackathon 2025**: CurricuLLM was an "Innovation Tier" sponsor. Dan Hart and the CurricuLLM Team set Challenge 3: "Curriculum-Aligned Script Generation for Educational Videos."
- **Cervantes project**: Built for the Cambridge EduX Hackathon 2026, Challenge 1: "Redefining Higher Education Assessment" (per project README).
- No public hackathon project repos using CurricuLLM were found on GitHub or Devpost.

## GitHub Repos Using CurricuLLM

**None found.** The `labicon/CurricuLLM` repo on GitHub is a completely different project (robotics curriculum learning with LLMs). There are no public repos integrating the curricullm.com API.

## Sources Searched

| URL / Query | Result |
|-------------|--------|
| PyPI search "curricullm" | No package found |
| npm search "curricullm" | No package found |
| GitHub "site:github.com CurricuLLM" | Only labicon/CurricuLLM (robotics, unrelated) |
| Google: "curricullm hackathon edtech integration example" | Found dev page, no code examples from third parties |
| Devpost search "curricullm" | No results |
| cambridge-edtech-society.org/hackathon-2025.html | Confirmed CurricuLLM as Innovation Tier sponsor |
| cambridge-edtech-society.org/hackathon-challenges-k3p8m2x.html | CurricuLLM Team set Challenge 3 |
