# CurricuLLM Known Issues and Limitations

Research date: 2026-04-04

## Documentation Gaps

1. **No public API reference docs** -- The developer page at curricullm.com/developers describes the API at a high level but does not provide a formal OpenAPI spec, endpoint reference, or detailed parameter documentation. All technical details must be inferred from the "OpenAI-compatible" claim.

2. **No rate limit documentation** -- Rate limits, concurrent request limits, and throttling behavior are not documented. This is a risk for production use.

3. **Credit-to-dollar mapping unclear** -- The team has "10 credits" but the relationship between credits and dollar amounts (and therefore token consumption) is not publicly documented. The pricing page shows per-million-token rates, but it is unclear if 1 credit = $1 or some other ratio.

4. **No error response documentation** -- No documentation on error codes, error response format, or retry behavior.

## Potential Issues

### Limited Public Usage
- No third-party code examples, blog posts, or community discussions found
- No packages on PyPI or npm
- No GitHub repos integrating the API (aside from Cervantes itself)
- This suggests the API is new and/or has a very small user base, which means:
  - Less battle-tested
  - Fewer community resources for troubleshooting
  - Risk of breaking changes without notice

### Niche Product Risk
- CurricuLLM appears to be a small startup/team (Dan Hart + team)
- Limited to AU/NZ curricula only
- No SLA or uptime guarantees found
- Support channel is a single email address: hello@curricullm.com

### Credit Conservation
- The team has only **10 credits**
- Credit consumption rate is unknown
- Recommendation: test with minimal prompts first to understand credit burn rate
- Consider using the console playground (console.curricullm.com) for initial testing rather than API calls, if playground usage is free or separate from API credits

### OpenAI Compatibility Unknowns
- It is unclear which OpenAI API features are supported:
  - `response_format: {"type": "json_object"}` -- likely supported but unconfirmed
  - Streaming (`stream: true`) -- unknown
  - Function calling / tool use -- unknown
  - Token counting in response -- unknown
  - System messages -- likely supported
  - Multi-turn conversations -- unknown

### Model Quality Unknowns
- No benchmarks or quality comparisons published
- No information on the base model (could be fine-tuned GPT, Llama, Mistral, etc.)
- The quality of curriculum grounding vs. a well-prompted generic LLM is unproven

## Community Reports

**None found.** No reviews, forum posts, Reddit threads, or community discussions about the CurricuLLM API were found in web searches. The product appears too new/niche for community feedback to exist.

## Recommendations

1. **Test API connectivity first** -- Make a minimal `/v1/models` GET request to verify the key works and see available models.
2. **Test a small rubric parse** -- Send a short rubric through the existing `curricullm_rubric_parse.md` prompt to verify JSON output quality.
3. **Monitor credit consumption** -- Check the console after each test call to understand credit burn rate.
4. **Keep the Gemini fallback** -- Given the unknowns, maintain the ability to fall back to Gemini for curriculum tasks.
5. **Contact support proactively** -- Email hello@curricullm.com to ask about rate limits, credit system details, and hackathon-specific support.
