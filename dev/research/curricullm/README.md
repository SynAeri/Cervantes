# CurricuLLM Integration Research

Research conducted: 2026-04-04
Team API key: `sk_bbzzSR_8ugTM6ZipfzJvUEnEl39pIpv` (10 credits)

## Files

| File | Description |
|------|-------------|
| `01-api-docs.md` | API base URL, authentication, OpenAI-compatible request/response format, available models, token pricing |
| `02-capabilities.md` | Curriculum standards supported, curriculum tokens, input/output formats, what CurricuLLM can and cannot do |
| `03-integration-examples.md` | Python/JS code examples, proposed Cervantes service layer changes, hackathon references |
| `04-known-issues.md` | Documentation gaps, credit system unknowns, limited community, model quality unknowns, recommendations |
| `05-fallback-strategy.md` | Gemini-based fallback architecture, three integration options, existing prompt quality assessment |

## Key Findings

1. **CurricuLLM is OpenAI-compatible.** Use `pip install openai` and point `base_url` to `https://api.curricullm.com/v1`. No custom SDK needed.

2. **It is a chat completions model, not a rubric-parsing API.** You send system+user messages and get text back. The existing prompts in `app/prompts/curricullm/` will work as-is.

3. **The current Gemini implementation already works.** The "CurricuLLM prompts" are actually model-agnostic prompts that work with any LLM. Switching to CurricuLLM is a one-line base URL change, not an architecture change.

4. **CurricuLLM is a small/new product.** No community examples, no third-party packages, no public benchmarks. The team should test quality vs. Gemini before committing.

5. **Recommended approach:** CurricuLLM primary with Gemini fallback (Option A in `05-fallback-strategy.md`).
