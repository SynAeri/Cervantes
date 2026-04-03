# system/

Core Gemini system prompts. These are loaded at runtime and define how Gemini behaves in each role within the pipeline. Each file is a complete system message — no assembly required.

## Files (to populate)

- `scene_generation.md` — System prompt for generating a full VN scene from planner output. Takes in CurricuLLM structured data, character profile, scene type (bridge/deep), and target misconception. Outputs formatted dialogue with emotion tags per the annotations contract.
- `pushback_dialogue.md` — System prompt for the real-time Socratic conversation engine. Runs during the multi-turn dialogue loop within a scene. Takes the student's response, conversation history, and target misconception. Generates character pushback without giving away the answer.
- `signal_extraction.md` — System prompt for extracting reasoning signals after a scene completes. Analyses the full conversation transcript and produces structured JSON: initial misconception, revision quality, transfer success, unresolved gaps. Runs in analytical mode, not narrative mode.

## Design principle

Each system prompt assumes structured upstream context — concepts, misconceptions, and rubric mapping are already known from CurricuLLM. Gemini never infers academic structure. It only writes scenes and analyses reasoning.
