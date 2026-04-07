# Firestore CRUD from Python (Async Patterns)

> Firestore operations for the Cervantes FastAPI backend.
> Last updated: 2026-04-04

---

## Async vs Sync Client

The `firebase-admin` SDK provides two Firestore modules:

| Module | Import | Returns |
|--------|--------|---------|
| `firebase_admin.firestore` | `firestore.client()` | Synchronous client (blocks the event loop) |
| `firebase_admin.firestore_async` | `firestore_async.client()` | **Async client (use this with FastAPI)** |

The async client was added in `firebase-admin==5.3.0`. Make sure you are on a recent version.

---

## Initialization

```python
import firebase_admin
from firebase_admin import credentials, firestore_async

cred = credentials.Certificate("serviceAccountKey.json")
app = firebase_admin.initialize_app(cred)

# Get the async Firestore client
db = firestore_async.client()
```

### As a FastAPI Dependency

```python
# app/backend/core/firebase.py

import firebase_admin
from firebase_admin import credentials, firestore_async
from google.cloud.firestore import AsyncClient

_db: AsyncClient | None = None

def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)

def get_db() -> AsyncClient:
    """FastAPI dependency replacing the old SQLAlchemy get_db()."""
    global _db
    if _db is None:
        _db = firestore_async.client()
    return _db
```

Usage in routes:

```python
from fastapi import Depends
from app.backend.core.firebase import get_db

@router.get("/arcs")
async def list_arcs(db=Depends(get_db)):
    docs = db.collection("arcs").where("class_id", "==", "some_class_id")
    results = []
    async for doc in docs.stream():
        results.append({"id": doc.id, **doc.to_dict()})
    return results
```

---

## CRUD Operations

### Create (Add Document)

```python
# Auto-generated ID
doc_ref = db.collection("arcs").document()  # generates random ID
await doc_ref.set({
    "class_id": "class_abc",
    "curriculum_data": {...},
    "narrative_arc": {...},
    "status": "draft",
    "created_at": firestore.SERVER_TIMESTAMP,
})
arc_id = doc_ref.id  # the auto-generated ID

# Or use .add() which returns (timestamp, doc_ref)
timestamp, doc_ref = await db.collection("arcs").add({
    "class_id": "class_abc",
    "status": "draft",
})
```

```python
# Explicit ID
doc_ref = db.collection("professors").document("prof_uid_from_firebase_auth")
await doc_ref.set({
    "email": "prof@university.edu",
    "name": "Dr. Smith",
    "institution": "MIT",
})
```

### Read (Get Document)

```python
# Single document
doc_ref = db.collection("arcs").document("arc_123")
doc = await doc_ref.get()

if doc.exists:
    data = doc.to_dict()
    print(f"Arc: {data}")
else:
    print("No such document")
```

### Read (Query Collection)

```python
# All documents in a collection
docs = db.collection("arcs").stream()
async for doc in docs:
    print(f"{doc.id} => {doc.to_dict()}")

# Filtered query
query = (
    db.collection("arcs")
    .where("class_id", "==", "class_abc")
    .where("status", "==", "draft")
    .order_by("created_at", direction="DESCENDING")
    .limit(10)
)
async for doc in query.stream():
    print(doc.to_dict())
```

### Update

```python
doc_ref = db.collection("arcs").document("arc_123")

# Update specific fields (merge)
await doc_ref.update({
    "status": "approved",
    "narrative_arc.title": "Updated Title",  # nested field update
})

# Set with merge (creates if not exists, updates if exists)
await doc_ref.set({"status": "published"}, merge=True)
```

### Delete

```python
# Delete a document
await db.collection("arcs").document("arc_123").delete()

# Delete a specific field
from google.cloud.firestore_v1 import DELETE_FIELD
await doc_ref.update({"misconceptions": DELETE_FIELD})
```

---

## Transactions

Firestore transactions ensure atomic read-then-write operations:

```python
from google.cloud.firestore_v1 import async_transactional

@async_transactional
async def enroll_student(transaction, db, student_id, class_id):
    # Check if already enrolled
    enrollment_query = (
        db.collection("enrollments")
        .where("student_id", "==", student_id)
        .where("class_id", "==", class_id)
        .limit(1)
    )
    existing = []
    async for doc in enrollment_query.stream(transaction=transaction):
        existing.append(doc)

    if existing:
        raise ValueError("Student already enrolled")

    # Create enrollment
    enrollment_ref = db.collection("enrollments").document()
    transaction.set(enrollment_ref, {
        "student_id": student_id,
        "class_id": class_id,
    })

# Usage:
transaction = db.transaction()
await enroll_student(transaction, db, "student_123", "class_abc")
```

---

## Batch Writes

For multiple writes that do not need reads (no transaction needed):

```python
batch = db.batch()

# Add multiple scenes at once
for i, scene_data in enumerate(scenes):
    ref = db.collection("scenes").document()
    batch.set(ref, {
        "arc_id": "arc_123",
        "scene_order": i,
        **scene_data,
    })

await batch.commit()
```

Batch limit: **500 operations** per batch.

---

## Subcollection Operations

```python
# Scenes as a subcollection of arcs
scene_ref = db.collection("arcs").document("arc_123").collection("scenes").document()
await scene_ref.set({
    "scene_order": 1,
    "scene_type": "bridge",
    "character_id": "don_quixote",
    "concept_target": "photosynthesis",
})

# Query subcollection
scenes = (
    db.collection("arcs").document("arc_123").collection("scenes")
    .order_by("scene_order")
)
async for doc in scenes.stream():
    print(doc.to_dict())
```

### Collection Group Queries

Query across ALL subcollections with the same name:

```python
# Find all scenes across all arcs for a specific character
all_scenes = (
    db.collection_group("scenes")
    .where("character_id", "==", "don_quixote")
)
async for doc in all_scenes.stream():
    print(f"Arc: {doc.reference.parent.parent.id}, Scene: {doc.to_dict()}")
```

Requires a **collection group index** in Firestore.

---

## Server Timestamps

```python
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

await doc_ref.set({
    "created_at": SERVER_TIMESTAMP,
    "updated_at": SERVER_TIMESTAMP,
})

# On update
await doc_ref.update({
    "updated_at": SERVER_TIMESTAMP,
})
```

---

## Array and Map Operations

```python
from google.cloud.firestore_v1 import ArrayUnion, ArrayRemove, Increment

# Add to array without duplicates
await doc_ref.update({
    "concept_targets": ArrayUnion(["new_concept"]),
})

# Remove from array
await doc_ref.update({
    "concept_targets": ArrayRemove(["old_concept"]),
})

# Increment a numeric field
await doc_ref.update({
    "attempt_count": Increment(1),
})
```

---

## Pagination with Cursors

```python
# First page
first_query = (
    db.collection("reasoning_traces")
    .where("student_id", "==", "student_123")
    .order_by("created_at", direction="DESCENDING")
    .limit(20)
)
docs = []
async for doc in first_query.stream():
    docs.append(doc)

# Next page (start after the last document)
if docs:
    next_query = (
        db.collection("reasoning_traces")
        .where("student_id", "==", "student_123")
        .order_by("created_at", direction="DESCENDING")
        .start_after(docs[-1])
        .limit(20)
    )
    async for doc in next_query.stream():
        ...
```

**Never use `.offset()`** -- it still reads and bills for skipped documents.

---

## Mapping SQLAlchemy Patterns to Firestore

| SQLAlchemy | Firestore Async |
|------------|-----------------|
| `session.add(obj)` | `await doc_ref.set(data)` |
| `session.query(Model).get(id)` | `await doc_ref.get()` |
| `session.query(Model).filter_by(x=y).all()` | `query.where("x", "==", y).stream()` |
| `session.commit()` | Not needed (writes are immediate) |
| `session.rollback()` | Use transactions for atomicity |
| `session.delete(obj)` | `await doc_ref.delete()` |
| JOINs | Not supported -- denormalize or do multiple queries |
| `JSONB` column | Native -- all Firestore data is JSON-like |

---

## Cleanup on Shutdown

```python
# In FastAPI lifespan
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase()
    yield
    # Cleanup: close async sessions
    firebase_admin.delete_app(firebase_admin.get_app())

app = FastAPI(lifespan=lifespan)
```

---

## Sources

- [firebase-admin-python async snippets (GitHub)](https://github.com/firebase/firebase-admin-python/blob/main/snippets/firestore/firestore_async.py)
- [firebase_admin.firestore_async module (Official)](https://firebase.google.com/docs/reference/admin/python/firebase_admin.firestore_async)
- [Firebase Python Admin SDK with asyncio (Medium)](https://hiranya911.medium.com/firebase-python-admin-sdk-with-asyncio-d65f39463916)
- [Firestore Add Data (Official)](https://firebase.google.com/docs/firestore/manage-data/add-data)
- [Firestore Query Data (Official)](https://firebase.google.com/docs/firestore/query-data/queries)
- [FastAPI + Firestore (Medium)](https://medium.com/@ma2020067145/building-an-app-with-firebase-firestore-and-fastapi-exploring-cloud-database-solutions-7dd47dda1176)
