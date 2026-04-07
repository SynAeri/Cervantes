# Firestore Data Model Design for Cervantes

> Mapping the current PostgreSQL/SQLAlchemy schema to Firestore.
> Last updated: 2026-04-04

---

## Current SQLAlchemy Schema (Reference)

```
professors  (professor_id PK, institution, email UNIQUE, password, name)
students    (student_id PK, first_name, last_name, email UNIQUE, subjects JSONB, extracurriculars JSONB)
classes     (class_id PK, professor_id FK, subject, module, name)
enrollments (enrollment_id PK, student_id FK, class_id FK, UNIQUE(student_id, class_id))
character_templates (template_id PK, name UNIQUE, role, personality_prompt, sprite_set, subject_affinity JSONB)
arcs        (arc_id PK, class_id FK, curriculum_data JSONB, narrative_arc JSONB, rubric_focus, concept_targets JSONB, misconceptions JSONB, status ENUM, created_at)
scenes      (scene_id PK, arc_id FK, scene_order, scene_type, character_id, concept_target, misconception_target, setup_narration, socratic_angles JSONB, generated_scene_content)
reasoning_traces (trace_id PK, student_id FK, scene_id FK, initial_answer, pushback_given, revised_answer, reflection, conversation_history JSONB, status ENUM, signal_extraction_result JSONB, created_at)
```

---

## Recommended Firestore Structure

### Option A: Top-Level Collections (Recommended)

This is the simpler, more flexible approach. Use top-level collections with document references (IDs) instead of foreign keys.

```
/professors/{professorId}
    email: string
    name: string
    institution: string
    created_at: timestamp
    (NO password field -- Firebase Auth handles this)

/students/{studentId}
    first_name: string
    last_name: string
    email: string
    subjects: array<string>
    extracurriculars: array<string>
    created_at: timestamp

/classes/{classId}
    professor_id: string  (reference to professors doc)
    subject: string
    module: string
    name: string

/enrollments/{enrollmentId}
    student_id: string
    class_id: string
    enrolled_at: timestamp

/character_templates/{templateId}
    name: string
    role: string
    personality_prompt: string
    sprite_set: string
    subject_affinity: map

/arcs/{arcId}
    class_id: string
    curriculum_data: map
    narrative_arc: map
    rubric_focus: string
    concept_targets: array<string>
    misconceptions: array<map>
    status: string  ("draft" | "approved" | "published")
    created_at: timestamp

/scenes/{sceneId}
    arc_id: string
    scene_order: number
    scene_type: string  ("bridge" | "deep" | "side_event")
    character_id: string
    concept_target: string
    misconception_target: string | null
    setup_narration: string
    socratic_angles: array<map>
    generated_scene_content: string
    created_at: timestamp

/reasoning_traces/{traceId}
    student_id: string
    scene_id: string
    arc_id: string  (denormalized for easier querying)
    initial_answer: string
    pushback_given: string
    revised_answer: string
    reflection: string
    conversation_history: array<map>
    status: string  ("mastery" | "revised_with_scaffolding" | "critical_gap")
    signal_extraction_result: map
    created_at: timestamp
```

**Why top-level:** Every entity is independently queryable. The current schema has many cross-entity queries (e.g., "all traces for a student across all arcs") that would be painful with deeply nested subcollections.

### Option B: Hybrid with Subcollections

Use subcollections only where the parent-child relationship is strict and you primarily query children within a single parent:

```
/professors/{professorId}
    ...

/classes/{classId}
    professor_id: string
    ...
    /arcs/{arcId}           <-- subcollection
        ...
        /scenes/{sceneId}   <-- sub-subcollection
            ...

/students/{studentId}
    ...
    /reasoning_traces/{traceId}  <-- subcollection
        ...

/enrollments/{enrollmentId}
    ...

/character_templates/{templateId}
    ...
```

**Trade-offs:**

| Aspect | Option A (All Top-Level) | Option B (Hybrid) |
|--------|--------------------------|-------------------|
| Query flexibility | High -- any field, any collection | Moderate -- collection group queries needed for cross-parent |
| Data locality | None -- separate reads | Scenes close to their arc |
| Security rules | Simpler | Can use parent doc in rules |
| Deletion complexity | Must manually delete related docs | Delete parent = subcollection orphaned (still must delete manually) |
| Implementation complexity | Low | Medium |

**Recommendation: Option A.** The project's query patterns (professor dashboard showing arcs across classes, student traces across scenes) favor flat top-level collections. Subcollections add complexity without clear benefit here.

---

## Key Design Decisions

### 1. Document IDs = Firebase Auth UIDs

For `professors` and `students`, use the Firebase Auth `uid` as the document ID:

```python
# When a professor registers:
doc_ref = db.collection("professors").document(user_uid)
await doc_ref.set({"email": email, "name": name, "institution": inst})
```

This makes lookups trivial: `db.collection("professors").document(current_user_uid)`.

### 2. No Password Field

Firebase Auth manages passwords, hashing, and verification. The `professors.password` column is eliminated entirely.

### 3. Denormalize Where It Helps

Firestore has no JOINs. For common read patterns, store redundant data:

```python
# In reasoning_traces, store arc_id alongside scene_id
# so you can query "all traces for an arc" without first looking up scenes
{
    "student_id": "...",
    "scene_id": "...",
    "arc_id": "...",           # denormalized
    "class_id": "...",         # denormalized
    "student_name": "Jane D.", # denormalized (for professor dashboard)
}
```

Trade-off: Updates to source data require updating all denormalized copies. Acceptable when the denormalized field rarely changes (arc_id, class_id, student_name).

### 4. JSONB Columns Map Naturally

Firestore stores all data as JSON-like maps/arrays natively. Fields like `curriculum_data`, `narrative_arc`, `conversation_history`, `signal_extraction_result` map directly with no special handling.

### 5. Enums Become Strings

`ArcStatus` and `ReasoningStatus` enums become plain string fields. Validate in application code or Firestore security rules:

```
// Security rule
allow write: if request.resource.data.status in ["draft", "approved", "published"];
```

### 6. Unique Constraints

Firestore does not enforce unique constraints natively. Options:
- **Email uniqueness:** Handled by Firebase Auth (emails are unique per project)
- **Enrollment uniqueness (student_id + class_id):** Use a deterministic document ID:

```python
enrollment_id = f"{student_id}_{class_id}"
doc_ref = db.collection("enrollments").document(enrollment_id)
await doc_ref.set({
    "student_id": student_id,
    "class_id": class_id,
    "enrolled_at": SERVER_TIMESTAMP,
})
```

If the document already exists, `.set()` overwrites (idempotent). Use a transaction to check-then-create if you need to reject duplicates.

---

## Common Query Patterns and Indexes

### Queries That Work Out of the Box (Single-Field)

```python
# All classes for a professor
db.collection("classes").where("professor_id", "==", prof_uid)

# All enrollments for a student
db.collection("enrollments").where("student_id", "==", student_uid)

# All arcs for a class
db.collection("arcs").where("class_id", "==", class_id)

# All scenes for an arc
db.collection("scenes").where("arc_id", "==", arc_id).order_by("scene_order")

# All traces for a student
db.collection("reasoning_traces").where("student_id", "==", student_uid)
```

### Queries Requiring Composite Indexes

These need explicit index creation (Firestore console or `firestore.indexes.json`):

```python
# Arcs for a class, filtered by status, ordered by date
db.collection("arcs") \
    .where("class_id", "==", class_id) \
    .where("status", "==", "published") \
    .order_by("created_at", direction="DESCENDING")
# Index: arcs (class_id ASC, status ASC, created_at DESC)

# Traces for a student in a specific arc
db.collection("reasoning_traces") \
    .where("student_id", "==", student_uid) \
    .where("arc_id", "==", arc_id) \
    .order_by("created_at")
# Index: reasoning_traces (student_id ASC, arc_id ASC, created_at ASC)

# Traces by status across a class (for professor analytics)
db.collection("reasoning_traces") \
    .where("class_id", "==", class_id) \
    .where("status", "==", "critical_gap") \
    .order_by("created_at", direction="DESCENDING")
# Index: reasoning_traces (class_id ASC, status ASC, created_at DESC)
```

### Index Configuration File

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "arcs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "class_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reasoning_traces",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "student_id", "order": "ASCENDING" },
        { "fieldPath": "arc_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reasoning_traces",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "class_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy with: `firebase deploy --only firestore:indexes`

---

## Document Size Limits

- Max document size: **1 MiB**
- `conversation_history` (array of dialogue turns) and `generated_scene_content` could grow large
- If a conversation exceeds ~500 turns, consider splitting into multiple documents or storing in Cloud Storage
- `narrative_arc` JSON is typically fine (curriculum data is bounded)

---

## Security Rules Sketch

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Professors can read/write their own profile
    match /professors/{professorId} {
      allow read, write: if request.auth != null && request.auth.uid == professorId;
    }

    // Students can read/write their own profile
    match /students/{studentId} {
      allow read, write: if request.auth != null && request.auth.uid == studentId;
    }

    // Classes: professors can CRUD their own classes
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.token.role == "professor";
    }

    // Arcs: professors only
    match /arcs/{arcId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == "professor";
    }

    // Reasoning traces: students write their own, professors read all
    match /reasoning_traces/{traceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.auth.token.role == "student"
                    && request.resource.data.student_id == request.auth.uid;
      allow update, delete: if false;  // traces are immutable
    }
  }
}
```

**Note:** Since the FastAPI backend uses the Admin SDK (which bypasses security rules), these rules primarily protect against direct client-side Firestore access. If all Firestore access goes through the backend, rules can be locked down entirely:

```javascript
match /{document=**} {
  allow read, write: if false;  // Only Admin SDK can access
}
```

---

## Sources

- [Firestore Data Model (Official)](https://firebase.google.com/docs/firestore/data-model)
- [Choose a Data Structure (Official)](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firestore Best Practices (Official)](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore Index Overview (Official)](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Firestore Query Performance Best Practices (Estuary)](https://estuary.dev/blog/firestore-query-best-practices/)
- [Designing an Effective Firebase Schema (Medium)](https://techblog.incentsoft.com/designing-an-effective-firebase-schema-best-practices-38d6a892a866)
- [Firestore Best Practices: 15 Rules (FireSchema)](https://fireschema.vercel.app/en/learn/firestore-best-practices)
