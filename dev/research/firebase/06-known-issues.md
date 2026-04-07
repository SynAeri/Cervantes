# Known Issues, Gotchas & Migration Pitfalls

> Problems to watch for when integrating Firebase into Cervantes.
> Last updated: 2026-04-04

---

## 1. Async Compatibility with FastAPI

### The Problem

FastAPI is async-first. The original `firebase-admin` SDK was synchronous (built on `requests`). Calling sync Firestore methods from an `async def` endpoint blocks the event loop.

### The Fix

Use `firebase_admin.firestore_async` (available since `firebase-admin>=5.3.0`):

```python
from firebase_admin import firestore_async
db = firestore_async.client()

# All operations are now awaitable
doc = await db.collection("arcs").document("arc_123").get()
```

### What Is Still Synchronous

`firebase_admin.auth.verify_id_token()` is **synchronous** but fast (uses cached public keys, no network call on most invocations). It is acceptable to call from an `async def` FastAPI endpoint. If you are concerned, wrap it:

```python
import asyncio

async def verify_token_async(token: str):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, verify_id_token, token)
```

In practice, `verify_id_token` is fast enough that this is rarely needed.

### Auth User Management Is Also Sync

`auth.create_user()`, `auth.get_user()`, `auth.set_custom_user_claims()` are all synchronous. Use `run_in_executor` if calling from async context under heavy load, or just call them directly for low-traffic admin operations.

---

## 2. Token Verification Edge Cases

### Token Expiry

- ID tokens expire after **1 hour**
- The client SDK auto-refreshes them, but if the frontend fails to refresh (e.g., user's device was asleep), the backend will reject the token
- Return `401 Unauthorized` with a clear message; the frontend should catch this and call `user.getIdToken(true)` to force refresh

### Custom Claims Propagation Delay

- After `auth.set_custom_user_claims(uid, {"role": "professor"})`, the claim does NOT appear in the current token
- The user must refresh their token: `await user.getIdToken(true)` on the client
- Auto-refresh happens within 1 hour, but for immediate effect, force it
- **Gotcha:** If you set claims during registration and immediately verify the token, the claims will not be there yet

### Revoked Tokens

- By default, `verify_id_token()` does NOT check if the token has been revoked
- To check revocation: `verify_id_token(token, check_revoked=True)`
- This makes an extra network call to Firebase; use only when security requirements demand it (e.g., after password change)

### Clock Skew

- `verify_id_token()` allows a small clock skew tolerance
- If your server clock is significantly off, token verification will fail
- Ensure NTP is configured on production servers / Docker containers

---

## 3. Firestore Performance Gotchas

### No JOINs

The biggest migration pain point. Every query that currently uses SQLAlchemy JOINs or relationships must be redesigned:

```python
# SQLAlchemy: Single query with JOIN
session.query(Arc, Class).join(Class).filter(Class.professor_id == uid).all()

# Firestore: Two separate queries
classes = db.collection("classes").where("professor_id", "==", uid).stream()
class_ids = [doc.id async for doc in classes]
# Then query arcs for each class_id (or use "in" operator, max 30 values)
arcs = db.collection("arcs").where("class_id", "in", class_ids).stream()
```

### The `in` Operator Limit

- `where("field", "in", [values])` supports **max 30 values**
- If a professor has more than 30 classes, you need multiple queries
- `array_contains_any` also limited to 30

### No Aggregation Queries (Limited)

- No `GROUP BY`, `SUM`, `AVG` at the database level
- Firestore added `count()`, `sum()`, `average()` aggregation queries, but they are limited
- For analytics (e.g., "how many students achieved mastery per arc"), you may need to:
  - Maintain counters in a separate document (denormalization)
  - Or fetch all docs and compute client-side

### Write Rate Limits

- **1 write per second per document** (sustained)
- **500 writes per second** to a single collection with sequential IDs
- Use random document IDs (the default) to avoid hotspots
- Batch writes are limited to **500 operations**

### Document Size Limit: 1 MiB

- `conversation_history` in `reasoning_traces` could grow large
- Each dialogue turn with full LLM responses might be 2-5 KB
- A 200-turn conversation ~ 1 MB, close to the limit
- **Mitigation:** Cap conversation length, or split into chunks stored as subcollection documents

### Reading Costs

- You are billed per document read, not per query
- A query returning 100 documents = 100 reads
- `.stream()` that returns 0 results = 1 read (minimum)
- `.get()` on a non-existent document = 1 read

---

## 4. Migration from SQLAlchemy/PostgreSQL

### Schema Flattening

- Foreign keys become simple string fields containing document IDs
- No referential integrity enforcement -- your application code must handle this
- Deleting a professor does not cascade-delete their classes/arcs

### No Transactions Across Collections (Caveat)

- Firestore transactions CAN span multiple collections (unlike some NoSQL databases)
- But transactions have a limit of **500 document writes** and must complete in **<60 seconds**
- All reads in a transaction must come before writes

### No Schema Enforcement

- Firestore is schemaless -- any document can have any fields
- Use Pydantic models in FastAPI to validate data before writing:

```python
from pydantic import BaseModel

class ArcCreate(BaseModel):
    class_id: str
    curriculum_data: dict
    status: str = "draft"

@router.post("/arcs")
async def create_arc(arc: ArcCreate, db=Depends(get_db)):
    doc_ref = db.collection("arcs").document()
    await doc_ref.set(arc.model_dump())
```

### No Unique Constraints

- Firestore has no UNIQUE constraint on fields
- Email uniqueness is handled by Firebase Auth
- For other uniqueness needs (e.g., `character_templates.name`), use deterministic document IDs or transactions with check-then-write

### No Auto-Increment IDs

- No `SERIAL` or auto-increment
- Document IDs are random strings by default (20 chars)
- If you need sequential IDs (e.g., `scene_order`), manage them in application logic

---

## 5. CORS Issues

### Firebase Auth + Separate Frontend/Backend

The current CORS config already handles this correctly:

```python
allow_origins=["http://localhost:3000", "http://localhost:3001"]
allow_headers=["*"]  # Includes Authorization header
allow_credentials=True
```

### Common CORS Mistake

If you switch to a production domain, update the origins:

```python
allow_origins=[
    "https://teacher.cervantes.app",
    "https://student.cervantes.app",
    "http://localhost:3000",  # keep for dev
    "http://localhost:3001",
]
```

### Firebase Auth Domain

Firebase Auth uses `cervantes-xxxxx.firebaseapp.com` for OAuth redirects. This does NOT need to be in CORS origins -- it is handled by Firebase's own infrastructure.

---

## 6. Cold Start Issues

### Firebase Admin SDK Initialization

- First call to `verify_id_token()` fetches Google's public keys (~200-500ms)
- Subsequent calls use cached keys (fast, <5ms)
- Keys are refreshed every ~6 hours
- **Mitigation:** Initialize Firebase SDK at app startup, not on first request

### Firestore Connection

- First Firestore operation establishes a gRPC connection (~500ms-1s)
- Keep the client as a singleton (module-level or app state)
- In serverless (Cloud Run), cold starts will include this overhead

---

## 7. Local Development Gotchas

### Firebase Emulator Suite

For local development without hitting production:

```bash
npm install -g firebase-tools
firebase init emulators  # select Auth + Firestore
firebase emulators:start
```

Connect Python SDK to emulators:

```python
import os
os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = "localhost:9099"

# Then initialize normally
firebase_admin.initialize_app()
```

**Gotcha:** The emulator environment variables must be set BEFORE `initialize_app()` is called.

### Service Account Key Security

- Never commit `serviceAccountKey.json` to git
- The key grants full admin access to your Firebase project
- Rotate keys if compromised: Firebase Console > Project Settings > Service Accounts > Generate New Key (this invalidates the old one)

---

## 8. Firestore Pricing Awareness

| Operation | Free Tier (Spark) | Cost (Blaze) |
|-----------|-------------------|--------------|
| Document reads | 50K/day | $0.06 per 100K |
| Document writes | 20K/day | $0.18 per 100K |
| Document deletes | 20K/day | $0.02 per 100K |
| Stored data | 1 GiB | $0.18/GiB/month |

For development with the $300 GCP credit, this is effectively free. But be aware of read-heavy patterns (e.g., fetching all students in a class for every dashboard load).

---

## Sources

- [FastAPI + Firebase Discussion (GitHub)](https://github.com/fastapi/fastapi/discussions/6962)
- [firebase_admin.firestore_async (Official)](https://firebase.google.com/docs/reference/admin/python/firebase_admin.firestore_async)
- [Firebase Python Admin SDK with asyncio (Medium)](https://hiranya911.medium.com/firebase-python-admin-sdk-with-asyncio-d65f39463916)
- [Firestore Best Practices (Official)](https://firebase.google.com/docs/firestore/best-practices)
- [Why I Switched Away from Firestore (DEV)](https://dev.to/spencerpauly/why-i-switched-away-from-google-firestore-3pn)
- [Out of the Fire(store): Traba's Journey to Postgres](https://engineering.traba.work/firestore-postgres-migration)
- [Firestore Query Performance Best Practices (Estuary)](https://estuary.dev/blog/firestore-query-best-practices/)
