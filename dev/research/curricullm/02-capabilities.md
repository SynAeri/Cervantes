# CurricuLLM Capabilities

Research date: 2026-04-04

## What CurricuLLM Does

CurricuLLM is an AI model specifically fine-tuned on educational curriculum standards. It provides "curriculum-aligned AI" where every response is grounded in official curriculum documents. It is NOT a rubric-parsing API with dedicated endpoints -- it is a **chat completions model** (like GPT or Gemini) that has deep curriculum knowledge baked in.

## Supported Curriculum Standards

| Model | Curriculum | Coverage |
|-------|-----------|----------|
| CurricuLLM-AU | Australian Curriculum v9 (ACARA) | K-12 (Years F-10) |
| CurricuLLM-AU-VIC | Victorian Curriculum F-10 | State-specific variant |
| CurricuLLM-AU-WA | Western Australia Curriculum | State-specific variant |
| CurricuLLM-NZ | New Zealand Curriculum | Full NZ curriculum |

Custom curricula available on request via `hello@curricullm.com`.

## Key Capability: Curriculum Tokens

"Curriculum tokens" represent the model's embedded understanding of education standards. When the model references curriculum knowledge (e.g., achievement standards, content descriptions, elaborations), it consumes curriculum tokens in addition to regular input/output tokens. This is what differentiates it from a generic LLM -- it has been specifically trained to understand and reference curriculum structure.

## Input Formats

CurricuLLM uses the standard OpenAI chat completions interface. Inputs are **text-based messages**:
- System message (instructions/prompt)
- User message (the rubric text, question, etc.)

There is **no native PDF/DOCX upload endpoint**. You must extract text from documents before sending to the API (which is what the Cervantes project already does via `rubric_text`).

## What It Can Do (Based on Developer Docs + Project Usage)

1. **Rubric/Assessment Parsing** -- Given assessment text, extract structured data (subject, outcomes, rubric dimensions, misconceptions, key concepts). This is how Cervantes uses it.

2. **Misconception Identification** -- Given a subject/topic/year level, identify common student misconceptions with pedagogical grounding. Cervantes has a dedicated prompt for this.

3. **Curriculum Alignment** -- Map content to specific curriculum standards, content descriptions, and achievement standards.

4. **Lesson Planning** -- Generate curriculum-aligned lesson plans, resources, quizzes.

5. **Student Tutoring** -- Age-appropriate, curriculum-grounded explanations.

## Output Format

Standard chat completion text. When you request JSON (via `response_format: {"type": "json_object"}`), it returns structured JSON. The schema is determined by your prompt, not by the API itself.

## Credit System

- Team has **10 credits** (pre-paid)
- Pricing: $2/M input tokens, $8/M output tokens, $2/M curriculum tokens
- No monthly commitment, no hidden fees
- Credits are consumed per-token, not per-request

### Credit Estimation for Cervantes

A typical rubric parse call:
- System prompt: ~500 tokens input
- Rubric text: ~1000 tokens input
- Structured JSON output: ~500 tokens output
- Curriculum tokens: ~200 tokens (estimated)

Rough cost per call: ~$0.006 (negligible per call, but 10 credits should last many hundreds of calls depending on credit-to-dollar mapping -- the exact credit-to-dollar ratio is not documented publicly).

## Limitations

- Text-only input (no PDF/DOCX upload)
- No streaming confirmed (but likely supported given OpenAI compat)
- No function calling / tool use confirmed
- No embedding model confirmed
- Limited to Australian and NZ curricula (no US, UK, etc.)
- No rate limit documentation available
