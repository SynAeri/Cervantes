# Known Issues & Gotchas

> Research date: 2026-04-04
> Sources:
> - https://github.com/googleapis/python-genai/issues
> - https://github.com/google-gemini/deprecated-generative-ai-python/issues
> - https://github.com/google-gemini/cookbook/issues/393
> - https://ai.google.dev/gemini-api/docs/deprecations

## Critical Issues Affecting Cervantes

### 1. Deprecated SDK -- Support Ended

**Impact: HIGH**

The `google-generativeai` package (used by Cervantes) had its support permanently ended on **November 30, 2025**. The repo has been renamed to `google-gemini/deprecated-generative-ai-python`.

- No bug fixes, security patches, or new features
- No access to newer models (Gemini 2.5+, 3.x)
- No access to new features (Live API, Veo, improved structured output)

**Action:** Migrate to `google-genai` immediately.

### 2. `gemini-2.0-flash-exp` Is Experimental and Unstable

**Impact: HIGH**

Experimental models:
- Not listed in official deprecation tables
- Can be removed without advance notice
- May have inconsistent behavior between versions
- `gemini-2.0-flash` (stable) shuts down June 1, 2026

**Action:** Switch to `gemini-2.5-flash` (stable).

### 3. JSON Mode Malformed Output

**Impact: MEDIUM (Cervantes already handles this)**

Multiple reported issues with JSON mode:
- **Issue #475 (deprecated repo):** JSON mode outputs extra brackets or missing brackets
- **Issue #1984 (new repo):** Batch mode causes 70% hallucination rate with JSON schemas -- output loops until max_output_tokens, producing truncated/corrupt JSON
- **Issue #1961 (new repo):** Flash 2.5 transcription exhausts output tokens due to repeated `[unclear]`, resulting in truncated JSON (recent regression)

**Mitigations:**
- Use `response_schema` (schema-constrained) instead of bare `response_mime_type="application/json"` (JSON mode)
- Set reasonable `max_output_tokens` to fail fast on loops
- Keep retry logic (Cervantes already has this via tenacity)
- Use `response.parsed` with Pydantic for type-safe parsing with the new SDK
- Lower temperature for structured extraction tasks

### 4. Tools + JSON Mode Conflict

**Impact: LOW (Cervantes doesn't use tools yet)**

GitHub issue #393 (cookbook): Using `response_mime_type=application/json` together with `tools` causes an error. The API forces `tool_config.function_calling_config.mode=ANY` instead.

### 5. Temperature 0.0 Silently Ignored in Multi-turn Chat

**Impact: MEDIUM**

GitHub issue (new SDK): `temperature=0.0` is treated as "unset" from the 2nd turn onward in multi-turn chat because 0.0 is falsy. This means subsequent turns use the model's default temperature.

**Workaround:** Use `temperature=0.01` instead of `0.0` if you need near-deterministic output in chat.

## Async-Specific Issues

### 6. BaseApiClient Attribute Error

**Issue #1990:** `'BaseApiClient' object has no attribute '_async_client_session_request_args'` -- occurs in certain initialization patterns.

**Workaround:** Use async context manager (`async with Client().aio as aclient`).

### 7. aiohttp Deprecation Warning

**Issue #1989:** `DeprecationWarning: Inheritance class AiohttpClientSession from ClientSession is discouraged` -- cosmetic warning from aiohttp library.

**Impact:** No functional impact, just noisy logs. Will likely be fixed in future SDK versions.

### 8. Async Function Calling Incomplete on Vertex AI

**Issue #1739:** Full async function calling support is not yet available for Vertex AI. Works fine with Gemini Developer API.

### 9. Async Chat Stream + Function Calls

**Issue #1938:** `AsyncChat.send_message_stream` does not pass `thought_signature` with function calls, potentially breaking agentic workflows.

## JSON Schema Specific Issues

### 10. Self-Referencing Pydantic Models

**Issue #1732:** `title` fields in nested JSON schemas are incorrectly interpreted as callable functions by the model.

**Workaround:** Avoid deeply nested self-referencing schemas; flatten where possible.

### 11. Pydantic Validators Not Supported with `.parsed`

**Issue #289:** Pydantic validators are not executed when using `response.parsed`. The SDK deserializes without validation.

**Workaround:** Manually validate after parsing:
```python
parsed = response.parsed
validated = MyModel.model_validate(parsed.model_dump())
```

## API Reliability Issues

### 12. Random "Invalid API Key" Errors

**Issue #2130:** API intermittently returns "Invalid API key" errors even with valid keys. Appears to be a transient server-side issue.

**Workaround:** Include in retry logic.

### 13. File Upload State Race Condition

**Issue #2191:** File API uploads may not be in ACTIVE state when generation begins, causing failures.

**Workaround:** Wait for file status to reach ACTIVE before using in generation.

## Best Practices Summary

| Issue | Severity | Mitigation |
|-------|----------|------------|
| Deprecated SDK | Critical | Migrate to `google-genai` |
| Experimental model | Critical | Use `gemini-2.5-flash` |
| Malformed JSON | Medium | Use `response_schema` + Pydantic |
| Broad retry | Medium | Narrow to transient exceptions |
| Temp 0.0 in chat | Medium | Use 0.01 instead |
| Async init errors | Low | Use context managers |
| API key flakiness | Low | Include in retry logic |
