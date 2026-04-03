# annotations/

VN output formatting contract. These files define the markup vocabulary that Gemini must use when generating scene dialogue. The frontend parser, sprite system, and ElevenLabs voice layer all consume these tags — one generation, three consumers.

## Files

- `emotion_tags.md` — Closed set of allowed emotion tags (e.g. `*thoughtful*`, `*surprised*`). Gemini must not invent tags outside this list. Each tag maps to a sprite state and a voice style parameter.
- `action_tags.md` — Physical action descriptors (e.g. `*leaning_forward*`, `*typing_on_laptop*`). Used for sprite animation triggers. Keep this set small — only include actions you have visual assets for.
- `formatting_tags.md` — Structural parsing contract: `[narration]`, `[character:Name]`, `[player_prompt]` line prefixes, tag placement rules, and the expected output shape. This is the source of truth for how the frontend splits raw Gemini output into renderable dialogue blocks.

## Rule

If a tag isn't defined here, it doesn't exist. Gemini's system prompts reference these files as the authoritative vocabulary.
