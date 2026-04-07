# Gemini API Structured Output (JSON Mode)

> Research date: 2026-04-04
> Sources:
> - https://ai.google.dev/gemini-api/docs/structured-output
> - https://blog.google/technology/developers/gemini-api-structured-outputs/
> - https://googleapis.github.io/python-genai/
> - https://github.com/google-gemini/cookbook/blob/main/quickstarts/JSON_mode.ipynb
> - https://deepwiki.com/google-gemini/cookbook/4.4-structured-output-and-json-mode

## Two Modes of Structured Output

### 1. JSON Mode (no schema constraint)

Forces the model to return valid JSON, but without enforcing a specific structure.

```python
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="List 3 countries with their capitals",
    config=types.GenerateContentConfig(
        response_mime_type="application/json"
    )
)
# Returns valid JSON but structure is model-decided
data = json.loads(response.text)
```

### 2. Schema-Constrained Output (recommended)

Forces the model to return JSON matching an exact schema. Two approaches:

#### Option A: Pydantic Models (recommended for Python)

```python
from pydantic import BaseModel, Field
from typing import List

class Country(BaseModel):
    name: str = Field(description="Country name")
    capital: str = Field(description="Capital city")
    population: int = Field(description="Approximate population")

class CountryList(BaseModel):
    countries: List[Country]

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="List 3 countries with details",
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=CountryList
    )
)

# Access parsed object directly
parsed = response.parsed  # Returns typed CountryList object
```

#### Option B: Raw JSON Schema

```python
schema = {
    "type": "object",
    "properties": {
        "countries": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "capital": {"type": "string"},
                    "population": {"type": "integer"}
                }
            }
        }
    }
}

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="List 3 countries",
    config={
        "response_mime_type": "application/json",
        "response_json_schema": schema
    }
)
```

## Supported JSON Schema Types

- `string`, `number`, `integer`, `boolean`, `object`, `array`, `null`
- `enum` for constrained string values
- `format` (e.g., date, email)
- `minimum`, `maximum` for numeric constraints
- `minItems`, `maxItems` for array length
- `title`, `description` for documentation/guidance

## Key Features

### `response.parsed` Property

The new SDK provides `.parsed` which returns a typed Pydantic object when `response_schema` is a Pydantic model. No manual `json.loads()` needed.

### Streaming with Structured Output

Streamed chunks return valid partial JSON strings that concatenate into complete objects:

```python
full_text = ""
for chunk in client.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents="List countries",
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=CountryList
    )
):
    full_text += chunk.text
result = json.loads(full_text)
```

### Key Ordering

Gemini 2.5+ models preserve the same key ordering as defined in your schema.

### Description Fields Are Important

The `description` field in Pydantic models / JSON schema is used by Gemini to understand what each property means. Use clear, specific descriptions to guide output quality.

## Limitations and Gotchas

### 1. Semantic Correctness NOT Guaranteed

> "While structured output guarantees syntactically correct JSON, it does not guarantee the values are semantically correct."

The JSON will be valid and match the schema, but values may be hallucinated or incorrect.

### 2. Schema Complexity Limits

Very large or deeply nested schemas may be rejected. Mitigations:
- Use shorter property names
- Reduce nesting depth
- Break complex schemas into smaller parts

### 3. Not All JSON Schema Features Supported

Unsupported properties are silently ignored. Stick to the supported types listed above.

### 4. Tool Use + JSON Mode Conflict

Known issue: configuring `response_mime_type=application/json` together with `tools` causes errors. The API may ask you to use `tool_config.function_calling_config.mode=ANY` instead. (GitHub issue #393 on cookbook repo)

### 5. Self-Referencing Pydantic Models

GitHub issue #1732 on `googleapis/python-genai`: JSON schemas with `$ref` or self-referencing Pydantic models may cause issues with function calling interpretation.

## Best Practices for Cervantes

1. **Use Pydantic models with `response_schema`** instead of just `response_mime_type="application/json"` -- this gives schema enforcement and `.parsed` support
2. **Use `Field(description=...)` generously** -- Gemini uses these to understand intent
3. **Keep temperature low (0.1-0.3) for structured extraction** -- higher temps increase schema deviation risk
4. **Still wrap in try/except** -- even with schema enforcement, edge cases exist
5. **Consider using `response.parsed`** instead of `json.loads(response.text)` for type safety

## Current Cervantes Pattern vs Recommended

**Current (deprecated SDK):**
```python
model_obj = genai.GenerativeModel(
    model_name=model,
    generation_config={
        "temperature": temperature,
        "response_mime_type": "application/json"
    }
)
response = await model_obj.generate_content_async(prompt)
return json.loads(response.text)
```

**Recommended (new SDK):**
```python
from pydantic import BaseModel

class MySchema(BaseModel):
    field1: str
    field2: int

response = await client.aio.models.generate_content(
    model="gemini-2.5-flash",
    contents=user_prompt,
    config=types.GenerateContentConfig(
        temperature=temperature,
        system_instruction=system_prompt,
        response_mime_type="application/json",
        response_schema=MySchema
    )
)
return response.parsed  # Typed Pydantic object
```
