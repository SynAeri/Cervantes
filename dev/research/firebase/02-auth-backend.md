# Firebase Auth Verification in FastAPI

> Backend authentication middleware patterns for Cervantes.
> Last updated: 2026-04-04

---

## Overview

The flow:
1. Frontend (Next.js) authenticates user via Firebase Client SDK
2. Frontend gets an **ID token** (JWT) from Firebase
3. Frontend sends token in `Authorization: Bearer <token>` header
4. FastAPI backend verifies the token using `firebase-admin` SDK
5. Backend extracts user info (`uid`, `email`, `role`) from the verified token

---

## Core Dependency: Token Verification

```python
# app/backend/core/auth.py

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin.auth import verify_id_token

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    token: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict:
    """
    FastAPI dependency that verifies Firebase ID token.
    Returns the decoded token dict containing uid, email, etc.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        # verify_id_token checks signature, expiration, audience, issuer
        decoded_token = verify_id_token(token.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

**Important:** `auto_error=False` on `HTTPBearer` prevents FastAPI from returning 403 (it would by default). We handle the missing-token case ourselves to return 401.

---

## Using the Dependency in Routes

```python
from fastapi import APIRouter, Depends
from typing import Annotated
from app.backend.core.auth import get_current_user

router = APIRouter(prefix="/api/arcs", tags=["arcs"])


@router.get("/")
async def list_arcs(user: Annotated[dict, Depends(get_current_user)]):
    """Protected route -- only authenticated users."""
    uid = user["uid"]
    email = user.get("email", "")
    # user dict also contains: name, picture, email_verified, etc.
    # ... fetch arcs for this professor
    return {"arcs": [], "user_uid": uid}
```

---

## Role-Based Access (Professor vs Student)

Firebase custom claims are the idiomatic way to handle roles:

### Setting custom claims (done once, e.g., at registration)

```python
from firebase_admin import auth

# After creating a user or upon registration
auth.set_custom_user_claims(uid, {"role": "professor"})
# or
auth.set_custom_user_claims(uid, {"role": "student"})
```

### Checking roles in dependencies

```python
async def require_professor(
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Dependency that requires the user to be a professor."""
    if user.get("role") != "professor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor access required",
        )
    return user


async def require_student(
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    if user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    return user
```

Usage:

```python
@router.post("/arcs")
async def create_arc(user: Annotated[dict, Depends(require_professor)]):
    # Only professors can create arcs
    ...

@router.post("/dialogue/respond")
async def submit_response(user: Annotated[dict, Depends(require_student)]):
    # Only students submit dialogue responses
    ...
```

**Note:** Custom claims propagate on the next token refresh (up to 1 hour). Force refresh on the client with `user.getIdToken(true)`.

---

## Creating Users from the Backend

```python
from firebase_admin import auth

# Create a professor
user = auth.create_user(
    email="prof@university.edu",
    password="securepassword",
    display_name="Dr. Smith",
)
# Set role
auth.set_custom_user_claims(user.uid, {"role": "professor"})

# Create a student
student = auth.create_user(
    email="student@university.edu",
    password="securepassword",
    display_name="Jane Doe",
)
auth.set_custom_user_claims(student.uid, {"role": "student"})
```

---

## What verify_id_token Returns

The decoded token dict looks like:

```python
{
    "uid": "abc123...",
    "email": "user@example.com",
    "email_verified": True,
    "name": "John Doe",
    "picture": "https://...",
    "iss": "https://securetoken.google.com/PROJECT_ID",
    "aud": "PROJECT_ID",
    "auth_time": 1234567890,
    "sub": "abc123...",  # same as uid
    "iat": 1234567890,
    "exp": 1234571490,  # 1 hour from iat
    "role": "professor",  # custom claim (if set)
    "firebase": {
        "identities": {...},
        "sign_in_provider": "password"  # or "google.com"
    }
}
```

---

## Token Verification Details

- `verify_id_token()` is a **synchronous** call (it uses cached public keys)
- It validates: signature (RS256), expiration, audience (project ID), issuer
- Tokens expire after **1 hour**; the client SDK auto-refreshes them
- The call does NOT hit Firebase servers on every request (keys are cached locally)
- First call may be slower (fetches Google's public keys)

---

## CORS Configuration (Already in Place)

The current `main.py` already has correct CORS for both dashboards:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # teacher-dashboard
        "http://localhost:3001",   # student-dashboard
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # This allows Authorization header
)
```

This is correct for Firebase Auth. The `Authorization` header is already covered by `allow_headers=["*"]`.

---

## Alternative: fastapi-cloudauth Library

```bash
pip install fastapi-cloudauth
```

```python
from fastapi_cloudauth.firebase import FirebaseCurrentUser

get_current_user = FirebaseCurrentUser(project_id="cervantes-xxxxx")

@router.get("/protected")
async def protected(user=Depends(get_current_user)):
    return {"uid": user.user_id}
```

Pros: Less boilerplate. Cons: Extra dependency, less control, may lag behind Firebase SDK updates.

**Recommendation:** Use the manual `verify_id_token` approach above. It is straightforward, well-documented, and gives full control.

---

## Replacing Current JWT Auth

The current `config.py` has `JWT_SECRET` and `JWT_ALGORITHM` settings for custom JWT auth. With Firebase Auth:

- **Remove:** `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRATION_HOURS` from settings
- **Remove:** Any custom JWT signing/verification code
- **Add:** `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`
- **Replace:** `get_db()` dependency with Firestore client dependency

---

## Sources

- [Firebase Auth verify_id_token (Python)](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [FastAPI + Firebase Auth (Medium)](https://medium.com/@gabriel.cournelle/firebase-authentication-in-the-backend-with-fastapi-4ff3d5db55ca)
- [Understanding Firebase ID Token Verification in Python (Medium)](https://medium.com/@yonaakio/understanding-firebase-id-token-verification-in-python-with-fastapi-18967b78a5b8)
- [FastAPI Security First Steps (Official)](https://fastapi.tiangolo.com/tutorial/security/first-steps/)
- [fastapi-cloudauth (GitHub)](https://github.com/tokusumi/fastapi-cloudauth)
- [FastAPI GitHub Discussion #6962](https://github.com/fastapi/fastapi/discussions/6962)
- [FastAPI GitHub Issue #4768](https://github.com/fastapi/fastapi/issues/4768)
