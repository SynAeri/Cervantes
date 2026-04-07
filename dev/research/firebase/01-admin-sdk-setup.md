# Firebase Admin SDK (Python) -- Setup & Initialization

> Research compiled for the Cervantes/La Mancha project.
> Last updated: 2026-04-04

---

## Installation

```bash
pip install firebase-admin
```

Requires **Python 3.9+** (3.9 is deprecated; use **3.10+**).

Add to `requirements.txt`:

```
firebase-admin
```

This replaces `sqlalchemy` and `psycopg2-binary` once the migration is complete.

---

## Initialization Patterns

### Option 1: Explicit Service Account JSON (recommended for local dev)

```python
import firebase_admin
from firebase_admin import credentials

cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
```

Download the key from: **Firebase Console > Project Settings > Service Accounts > Generate New Private Key**.

Store the JSON file outside version control. Add to `.gitignore`:

```
serviceAccountKey.json
*.json
!package.json
!tsconfig.json
```

### Option 2: Environment Variable Pointing to JSON (good for Docker)

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

```python
import firebase_admin

# SDK auto-discovers credentials from the env var
firebase_admin.initialize_app()
```

This is the approach used in the FastAPI + Firebase Medium tutorial (see sources).

### Option 3: Application Default Credentials (for GCP-hosted environments)

```python
import firebase_admin
from firebase_admin import credentials

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
```

Works automatically on Cloud Run, App Engine, Cloud Functions. No JSON file needed -- the environment provides credentials.

### Option 4: Inline Credentials from Environment Variables (no JSON file at all)

```python
import firebase_admin
from firebase_admin import credentials
import json
import os

# Store the entire JSON content as a single env var
service_account_info = json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT_JSON"])
cred = credentials.Certificate(service_account_info)
firebase_admin.initialize_app(cred)
```

Useful for CI/CD and container environments where mounting files is inconvenient.

---

## Configuration Options

`initialize_app()` accepts an optional `options` dict:

```python
firebase_admin.initialize_app(cred, {
    'projectId': 'cervantes-xxxxx',
    'storageBucket': 'cervantes-xxxxx.appspot.com',
    'databaseURL': 'https://cervantes-xxxxx.firebaseio.com',  # only for Realtime DB
})
```

For Firestore-only usage, `projectId` is auto-detected from the service account.

---

## Multiple App Instances

```python
default_app = firebase_admin.initialize_app(cred)
other_app = firebase_admin.initialize_app(cred, name='other')
```

Unlikely to be needed, but supported.

---

## Integration Point for Cervantes

In the current codebase, `app/backend/core/config.py` uses `pydantic_settings.BaseSettings`. A clean integration pattern:

```python
# app/backend/core/firebase.py
import firebase_admin
from firebase_admin import credentials, firestore_async
from app.backend.core.config import settings
import json

def init_firebase():
    """Initialize Firebase Admin SDK. Call once at startup."""
    if firebase_admin._apps:
        return  # Already initialized

    if hasattr(settings, 'FIREBASE_SERVICE_ACCOUNT_JSON') and settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        # From env var containing JSON string
        service_info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        cred = credentials.Certificate(service_info)
    elif hasattr(settings, 'GOOGLE_APPLICATION_CREDENTIALS'):
        # Let SDK auto-discover
        cred = None
    else:
        cred = credentials.Certificate("serviceAccountKey.json")

    firebase_admin.initialize_app(cred)


def get_firestore_client():
    """Return the async Firestore client."""
    return firestore_async.client()
```

Call `init_firebase()` in `main.py` at startup (in a `lifespan` handler or before route registration).

---

## Sources

- [Firebase Admin SDK Setup (Official)](https://firebase.google.com/docs/admin/setup)
- [firebase-admin-python GitHub](https://github.com/firebase/firebase-admin-python)
- [Firebase Admin Python Release Notes](https://firebase.google.com/support/release-notes/admin/python)
- [Firebase Service Accounts Overview](https://firebase.google.com/support/guides/service-accounts)
- [FastAPI + Firebase Auth (Medium)](https://medium.com/@gabriel.cournelle/firebase-authentication-in-the-backend-with-fastapi-4ff3d5db55ca)
