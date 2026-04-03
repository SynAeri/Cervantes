# Misconception Extract Prompt

## When to Use

Use this as a **separate call** from rubric parsing when:
- The rubric parse returned weak or no misconceptions
- You want deeper misconception coverage for a specific concept
- The planner needs more Socratic angles than the initial parse provided

## System Message

```
You are a curriculum specialist for the Australian Curriculum. Given a subject, topic, and learning outcomes, identify the most common student misconceptions for this content area.

For each misconception, explain:
- What students incorrectly believe
- Why this belief forms (the underlying reasoning error)
- What the correct understanding is
- A scenario that would expose this misconception

Return ONLY valid JSON as an array:

[
  {
    "misconception": "string — the incorrect belief",
    "why_students_think_this": "string — root cause of the error",
    "correct_understanding": "string — what they should understand instead",
    "exposing_scenario": "string — a brief real-world situation that would reveal this gap"
  }
]

Rules:
- Generate 3-5 misconceptions, ordered from most common to least.
- Misconceptions must be specific to the topic, not generic study skills issues.
- Exposing scenarios should be concrete and relatable to the target year level.
- Do not include misconceptions that are trivially obvious or definitional.
```

## User Message Template

```
Subject: {subject}
Topic: {topic}
Year level: {year_level}
Learning outcomes:
{learning_outcomes_as_bullet_list}

Identify the most common student misconceptions for this content.
```

## Example Call

### User Message

```
Subject: Digital Technologies
Topic: Database normalisation (1NF, 2NF, 3NF)
Year level: Year 10
Learning outcomes:
- Explain the purpose of normalisation in relational databases
- Identify and resolve data redundancy in a given schema
- Justify when denormalisation is an appropriate design choice
```

### Expected Output

```json
[
  {
    "misconception": "Normalisation always improves database performance",
    "why_students_think_this": "Students associate organised data with faster queries, not realising that splitting tables introduces join overhead that can slow reads",
    "correct_understanding": "Normalisation reduces redundancy and update anomalies but can decrease read performance due to joins. The right level depends on the use case.",
    "exposing_scenario": "A school library app needs to display a student's full borrowing history with book titles, authors, and due dates on one screen. The fully normalised version requires joining 4 tables for each page load."
  },
  {
    "misconception": "Denormalisation is bad practice and should always be avoided",
    "why_students_think_this": "Textbooks emphasise normalisation as best practice, so students infer that any deviation is an error",
    "correct_understanding": "Denormalisation is a deliberate design choice to optimise read-heavy workloads, commonly used in dashboards, reports, and caching layers.",
    "exposing_scenario": "A teacher dashboard needs to show average grades per class instantly. Recalculating from normalised tables on every page load takes 3 seconds. A denormalised summary table loads in milliseconds."
  }
]
```

## Integration Notes

- The `exposing_scenario` field is the direct seed for Gemini's scene generation
- Pass these to the planner, which assigns each misconception to a scene in the arc
- The `correct_understanding` field feeds Gemini's pushback logic — it knows where the student should end up
- Order matters: first misconception = first Socratic scene in the arc (most common addressed first)
- Store output alongside the rubric parse in `data/parsed_assessments/structured/`
