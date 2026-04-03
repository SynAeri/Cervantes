# curricullm/

System prompts and integration reference for CurricuLLM API calls. CurricuLLM is the academic parser in the pipeline — it extracts structured assessment data from teacher uploads. It does not generate scenes or dialogue.

## Files

- `curricullm_rubric_parse.md` — System prompt for extracting structured JSON from uploaded rubrics, task sheets, and assessment notices. Returns subject, module, learning outcomes, rubric dimensions, misconceptions, and key concepts.
- `curricullm_misconception_extract.md` — System prompt for generating deeper misconceptions when the rubric parse doesn't return enough Socratic angles. Includes `exposing_scenario` fields that seed Gemini's scene generation.

## Scope

CurricuLLM-AU covers Australian Curriculum K-12 (Years F-10). All demo content should target this range. The pipeline architecture is curriculum-model-agnostic — swap the model for university content later, everything downstream stays the same.
