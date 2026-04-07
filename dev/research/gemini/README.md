# Gemini API Research for Cervantes

> Generated: 2026-04-04
> Context: Cervantes is a FastAPI backend using Google Gemini for AI-powered educational content generation (visual novel scenes, narrative arcs, dialogue). It currently uses the **deprecated** `google-generativeai` SDK with `gemini-2.0-flash-exp`.

## Critical Findings

1. **The SDK is deprecated.** `google-generativeai` support ended Nov 30, 2025. Migrate to `google-genai`.
2. **The model is experimental.** `gemini-2.0-flash-exp` can disappear without notice. Switch to `gemini-2.5-flash` (stable).
3. **`gemini-2.0-flash` shuts down June 1, 2026.** Even the stable 2.0 line is end-of-life.

## Research Files

| File | Description |
|------|-------------|
| [01-quickstart.md](./01-quickstart.md) | New SDK setup, auth, basic usage patterns with `google-genai` |
| [02-structured-output.md](./02-structured-output.md) | JSON mode, schema-constrained output, Pydantic integration |
| [03-async-patterns.md](./03-async-patterns.md) | Async client usage, streaming, FastAPI integration patterns |
| [04-models-and-pricing.md](./04-models-and-pricing.md) | Available models, deprecation timeline, pricing, rate limits |
| [05-known-issues.md](./05-known-issues.md) | GitHub issues, common problems, gotchas, and workarounds |
| [06-sdk-migration.md](./06-sdk-migration.md) | Step-by-step migration guide with code diffs for Cervantes |

## Quick Migration Summary

```
requirements.txt:  google-generativeai  ->  google-genai
Import:            import google.generativeai as genai  ->  from google import genai
Auth:              genai.configure(api_key=...)  ->  client = genai.Client(api_key=...)
Model:             genai.GenerativeModel(...)  ->  (pass model as string param)
Async:             model.generate_content_async(...)  ->  client.aio.models.generate_content(...)
Config:            dict in constructor  ->  types.GenerateContentConfig(...)
JSON:              json.loads(response.text)  ->  response.parsed (with response_schema)
Default model:     gemini-2.0-flash-exp  ->  gemini-2.5-flash
```

## Priority Actions

1. **P0:** Replace `gemini-2.0-flash-exp` with `gemini-2.5-flash` (even before full SDK migration)
2. **P1:** Migrate from `google-generativeai` to `google-genai`
3. **P2:** Add Pydantic `response_schema` for type-safe structured output
4. **P2:** Narrow retry logic to transient exceptions only
5. **P3:** Separate system instructions from user prompts properly
