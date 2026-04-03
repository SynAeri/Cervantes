# examples/

Few-shot examples injected into Gemini prompts. Gemini follows examples better than rules — a single well-crafted example scene is worth more than a page of instructions.

## Files (to populate)

- `bridge_scene_example.md` — A complete example of a bridge scene output showing correct formatting: narration lines, character dialogue with emotion tags, player prompt placement, and scene resolution.
- `deep_scene_example.md` — A complete example of a deep Socratic scene showing the full pushback loop: character poses scenario → student responds → character challenges → student revises. Includes emotion tag usage and the transition to journal update.
- `journal_entry_example.md` — A complete example of a reasoning trace journal entry: initial answer, misconception identified, pushback given, revised answer, reflection summary.

## Why this matters

Without examples, Gemini will default to chatbot-style responses. With examples, it produces VN-formatted dialogue that the frontend parser can consume without breaking. These are the single most important files for output consistency. Write them by hand — do not generate them with AI.
