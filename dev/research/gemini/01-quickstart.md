# Gemini API Python Quickstart

> Research date: 2026-04-04
> Sources:
> - https://ai.google.dev/gemini-api/docs/quickstart
> - https://ai.google.dev/gemini-api/docs/libraries
> - https://googleapis.github.io/python-genai/
> - https://github.com/googleapis/python-genai

## SDK: `google-genai` (the new unified SDK)

**IMPORTANT:** The old `google-generativeai` package is DEPRECATED (support ended Nov 30, 2025). The Cervantes project currently uses the deprecated SDK and must migrate to `google-genai`.

### Installation

```bash
pip install google-genai
```

Requires Python 3.9+.

### API Key Setup

**Option 1: Environment variable (recommended)**

```bash
export GEMINI_API_KEY="your-api-key"
```

The client auto-detects this variable:

```python
from google import genai
client = genai.Client()  # Picks up GEMINI_API_KEY automatically
```

**Option 2: Explicit API key**

```python
from google import genai
client = genai.Client(api_key="your-api-key")
```

**Option 3: Environment variables for Vertex AI**

```bash
export GOOGLE_GENAI_USE_VERTEXAI=true
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
```

### Basic Text Generation

```python
from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain how AI works in a few words"
)
print(response.text)
```

### With Configuration

```python
from google.genai import types

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Tell me a story",
    config=types.GenerateContentConfig(
        temperature=0.7,
        max_output_tokens=1000,
        top_p=0.95,
        top_k=20,
        system_instruction="You are a creative storyteller."
    )
)
```

### System Instructions

In the new SDK, system instructions are passed via the `config` parameter, NOT as a separate model parameter:

```python
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="User message here",
    config=types.GenerateContentConfig(
        system_instruction="You are a helpful assistant that responds in JSON."
    )
)
```

### Resource Management

Use context managers for proper cleanup:

```python
# Sync
with genai.Client() as client:
    response = client.models.generate_content(...)

# Async
async with genai.Client().aio as aclient:
    response = await aclient.models.generate_content(...)
```

Or explicitly close:

```python
client.close()
# or
await aclient.aclose()
```

### Client Architecture

The new SDK uses a **client-centric** design with service namespaces:

| Service | Purpose |
|---------|---------|
| `client.models` | Text/multimodal generation, embeddings, token counting |
| `client.aio.models` | Async versions of model operations |
| `client.files` | File upload/management |
| `client.chats` | Multi-turn chat sessions |
| `client.caches` | Context caching |
| `client.tunings` | Model fine-tuning |
| `client.batches` | Batch processing |

### Token Counting

```python
response = client.models.count_tokens(
    model="gemini-2.5-flash",
    contents="Your text here"
)
print(response.total_tokens)
```

### Multi-turn Chat

```python
chat = client.chats.create(model="gemini-2.5-flash")
response = chat.send_message(message="Hello!")
response = chat.send_message(message="Tell me more")
```

### File Upload

```python
my_file = client.files.upload(file="document.pdf")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[my_file, "Summarize this document"]
)
```

## Relevance to Cervantes

The Cervantes project needs to:
1. Replace `pip install google-generativeai` with `pip install google-genai`
2. Replace `import google.generativeai as genai` with `from google import genai`
3. Create a `Client` instance instead of using `genai.configure()` + `genai.GenerativeModel()`
4. Move to `client.models.generate_content()` / `client.aio.models.generate_content()`
5. Use `config=types.GenerateContentConfig(...)` for all generation parameters

See `06-sdk-migration.md` for a detailed migration plan.
