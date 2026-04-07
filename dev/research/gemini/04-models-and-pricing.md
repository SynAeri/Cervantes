# Gemini Models, Pricing & Rate Limits

> Research date: 2026-04-04
> Sources:
> - https://ai.google.dev/gemini-api/docs/models
> - https://ai.google.dev/gemini-api/docs/pricing
> - https://ai.google.dev/gemini-api/docs/rate-limits
> - https://ai.google.dev/gemini-api/docs/deprecations

## Current Model Landscape (April 2026)

### Recommended Models

| Model | Status | Best For | Notes |
|-------|--------|----------|-------|
| `gemini-2.5-flash` | **Stable** | Low-latency, high-volume, reasoning | Best price-performance. **Recommended for Cervantes.** |
| `gemini-2.5-flash-lite` | **Stable** | Budget-friendly, fastest | Even cheaper, less capable |
| `gemini-3-flash-preview` | Preview | Advanced flash capabilities | Newer but not yet stable |
| `gemini-3.1-flash-lite-preview` | Preview | Frontier performance at low cost | Newest flash-lite |
| `gemini-3.1-pro-preview` | Preview | Advanced reasoning | Pro-tier, more expensive |

### Cervantes Currently Uses: `gemini-2.0-flash-exp`

**This model is problematic:**
- `gemini-2.0-flash-exp` is an **experimental** model -- not tracked in official deprecation tables
- Experimental models can disappear without notice
- The stable `gemini-2.0-flash` is deprecated and shuts down **June 1, 2026**
- **Migrate to `gemini-2.5-flash` immediately** -- it is the official stable replacement

## Deprecation Timeline

| Model | Shutdown Date | Replacement |
|-------|---------------|-------------|
| `gemini-2.0-flash` | June 1, 2026 | `gemini-2.5-flash` |
| `gemini-2.0-flash-lite` | June 1, 2026 | `gemini-2.5-flash-lite` |
| `gemini-2.5-pro` (stable) | June 17, 2026 | `gemini-3.1-pro-preview` |
| `gemini-3-pro-preview` | **Already shut down** (March 9, 2026) | `gemini-3.1-pro-preview` |

**Key warning:** Shutdown dates are the EARLIEST possible dates. Google commits to advance notice before exact shutdown.

## Pricing (Paid Tier, per 1M tokens)

### Flash Models (most relevant to Cervantes)

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| `gemini-2.5-flash-lite` | $0.10 | $0.40 | Cheapest option |
| `gemini-2.5-flash` | ~$0.15-0.50 | ~$1.00-3.00 | Best value with reasoning |
| `gemini-3-flash-preview` | $0.50 | $3.00 | Preview pricing |
| `gemini-3.1-flash-lite-preview` | $0.25 | $1.50 | Preview pricing |

### Pro Models (for reference)

| Model | Input | Output |
|-------|-------|--------|
| `gemini-3.1-pro-preview` | $2.00 (<=200k), $4.00 (>200k) | $12.00-$18.00 |

### Free Tier

- Free access to certain models with rate limits
- No cost for input/output tokens
- Suitable for development and testing

### Cost Optimization

- **Context Caching**: $0.20-$0.40 per 1M cached tokens + storage fees
- **Batch API**: 50% discount on standard pricing
- **Google Search Grounding**: 5,000 prompts/month free, then $14/1,000 queries

## Rate Limits

### By Tier

| Tier | Qualification | Billing Cap | RPM | TPM | RPD |
|------|---------------|-------------|-----|-----|-----|
| Free | Active project | N/A | 5-15 | Varies | Varies |
| Tier 1 | Billing account linked | $250/month | 150-300 | 1M | 1,500 |
| Tier 2 | $100+ spend + 3 days | $2,000/month | 500-1,500 | 2M | 10,000 |
| Tier 3 | $1,000+ spend + 30 days | $20,000-100,000+ | 1,000-4,000+ | Custom | Custom |

### Key Rate Limit Rules

- Limits are **per project**, not per API key
- RPD resets at **midnight Pacific time**
- Exceeding ANY limit triggers a `429 Resource Exhausted` error
- Tier upgrades: Free->Tier 1 is instant, subsequent upgrades within 10 minutes
- **Priority inference** has separate limits at 0.3x standard

### Batch API Limits

- Concurrent batch requests: 100
- Input file size: 2GB max
- Storage: 20GB limit

## Recommendations for Cervantes

### Immediate Actions

1. **Replace `gemini-2.0-flash-exp` with `gemini-2.5-flash`** everywhere
   - In `llm_client.py` default parameter
   - In `arc/service.py` explicit model references
   - In any other service files

2. **Make model configurable** via environment variable:
   ```python
   # In config
   GEMINI_MODEL: str = "gemini-2.5-flash"
   ```

### Cost Estimation for Cervantes

A typical arc generation involves:
- Phase 1 (rubric parsing): ~1-2K input tokens, ~500 output tokens
- Phase 2 (narrative arc): ~3-5K input tokens, ~2K output tokens
- Scene generation: ~2-3K input tokens, ~1-2K output tokens per scene

At `gemini-2.5-flash` pricing, each full arc generation would cost roughly $0.001-0.005 (well under 1 cent).

### Rate Limit Strategy

For a classroom application:
- Free tier is likely sufficient for development
- Tier 1 (150-300 RPM) handles most classroom scenarios
- Implement exponential backoff for 429 errors (already done with tenacity)
