# Fallback Strategy: Gemini-Based Curriculum Parsing

Research date: 2026-04-04

## Context

The current Cervantes implementation already uses Gemini (`gemini-2.0-flash-exp`) with curriculum-specific prompts for rubric parsing. This IS the fallback -- and it works today. The existing prompts in `app/prompts/curricullm/` are well-designed for Gemini and do not depend on CurricuLLM at all despite the directory name.

## Current Architecture (What Already Works)

```
Teacher uploads rubric text
        |
        v
[Gemini gemini-2.0-flash-exp]
  + curricullm_rubric_parse.md system prompt
        |
        v
Structured JSON (subject, outcomes, rubric dimensions, misconceptions)
        |
        v
[Gemini gemini-2.0-flash-exp]
  + scene_generation.md system prompt
        |
        v
Narrative arc with VN scenes
```

Key files:
- `app/prompts/curricullm/curricullm_rubric_parse.md` -- System prompt for structured rubric extraction
- `app/prompts/curricullm/curricullm_misconception_extract.md` -- System prompt for deeper misconception coverage
- `app/backend/features/arc/service.py` -- Orchestrates the two-phase pipeline
- `app/backend/core/llm_client.py` -- Gemini API wrapper

## Proposed Integration Architecture

```
Teacher uploads rubric text
        |
        v
[CurricuLLM-AU API]  ----fallback----> [Gemini]
  + same rubric_parse prompt            + same rubric_parse prompt
        |                                      |
        v                                      v
Structured JSON  <-----------------------------+
        |
        v
[Gemini gemini-2.0-flash-exp]
  + scene_generation.md system prompt
        |
        v
Narrative arc with VN scenes
```

## Fallback Implementation Strategy

### Option A: CurricuLLM Primary, Gemini Fallback (Recommended)

```python
async def parse_rubric_with_fallback(rubric_text: str, system_prompt: str) -> dict:
    """Try CurricuLLM first, fall back to Gemini on failure."""
    
    # Attempt 1: CurricuLLM
    try:
        result = await curricullm_generate(
            system=system_prompt,
            user=f"Here are the assessment materials for parsing:\n\n---\n{rubric_text}\n---\n\nExtract the structured assessment summary as JSON.",
            model="CurricuLLM-AU",
            temperature=0.3,
            response_format="json"
        )
        return {"data": result, "source": "curricullm"}
    except Exception as e:
        logger.warning(f"CurricuLLM failed, falling back to Gemini: {e}")
    
    # Attempt 2: Gemini fallback (current behavior)
    result = await llm_client.generate_with_retry(
        system=system_prompt,
        user=f"Here are the assessment materials for parsing:\n\n---\n{rubric_text}\n---\n\nExtract the structured assessment summary as JSON.",
        response_format="json",
        model="gemini-2.0-flash-exp",
        temperature=0.3
    )
    return {"data": result, "source": "gemini_fallback"}
```

### Option B: Gemini Only (Zero Risk, Current State)

Keep the current implementation unchanged. The existing prompts are well-engineered and already produce good results with Gemini. The prompts reference "Australian Curriculum" knowledge explicitly, which Gemini handles reasonably well.

Advantages:
- No API dependency on a small/new service
- No credit consumption concerns
- Already working and tested

Disadvantages:
- Gemini lacks the deep curriculum-specific training that CurricuLLM provides
- Misconception identification may be less pedagogically grounded
- Curriculum alignment may be less precise

### Option C: A/B Testing

Run both APIs in parallel during development to compare output quality:

```python
async def compare_curriculum_outputs(rubric_text: str, system_prompt: str):
    """Run both APIs and compare for quality assessment."""
    import asyncio
    
    curricullm_task = curricullm_generate(...)
    gemini_task = llm_client.generate_with_retry(...)
    
    curricullm_result, gemini_result = await asyncio.gather(
        curricullm_task, gemini_task, return_exceptions=True
    )
    
    return {
        "curricullm": curricullm_result,
        "gemini": gemini_result,
    }
```

## Enhancing the Gemini Fallback

If CurricuLLM proves unavailable or too expensive, the Gemini fallback can be improved:

1. **Add Australian Curriculum reference data** -- Include content descriptions and achievement standards from https://www.australiancurriculum.edu.au/ as context in the system prompt.

2. **Use the V9 curriculum machine-readable data** -- ACARA provides machine-readable curriculum at https://rdf.australiancurriculum.edu.au/ which could be loaded as reference material.

3. **Fine-tune the misconception prompt** -- The `curricullm_misconception_extract.md` prompt is already well-structured. Adding subject-specific misconception databases (from educational research) to the context would improve Gemini's output quality.

4. **Validate output with curriculum codes** -- Post-process Gemini output to verify that referenced curriculum areas actually exist in the V9 Australian Curriculum.

## Recommendation

Start with **Option A** (CurricuLLM primary, Gemini fallback):
1. Implement the CurricuLLM client as a thin OpenAI-compatible wrapper
2. Test with 1-2 rubric parses to verify quality and credit consumption
3. If CurricuLLM quality is notably better, use it for all curriculum tasks
4. If quality is comparable to Gemini, conserve credits and default to Gemini
5. Always maintain the Gemini fallback for reliability

## Existing Prompt Quality Assessment

The prompts in `app/prompts/curricullm/` are high quality and model-agnostic:

- `curricullm_rubric_parse.md`: Clean JSON schema, specific rules, good example output. Works with any capable LLM.
- `curricullm_misconception_extract.md`: Well-structured with `exposing_scenario` field that feeds downstream scene generation. The integration notes document the data flow clearly.

These prompts will work identically with CurricuLLM-AU or Gemini -- no prompt changes needed for the API switch.
