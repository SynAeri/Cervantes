# Firebase Research for Cervantes (La Mancha)

> Reference documentation for integrating Firebase into the Cervantes project.
> Compiled: 2026-04-04

---

## Context

The Cervantes project is migrating from PostgreSQL/SQLAlchemy to Firebase for:
- **Authentication** (replacing custom JWT with Firebase Auth)
- **Firestore** (replacing PostgreSQL as the primary database)
- **Cloud Storage** (for rubric PDFs, DOCX uploads)

Stack: FastAPI (Python) backend, two Next.js 16 frontends (teacher + student dashboards).

---

## Files

| File | Description |
|------|-------------|
| [`01-admin-sdk-setup.md`](./01-admin-sdk-setup.md) | Python `firebase-admin` SDK installation, initialization patterns (service account JSON, env vars, ADC), and integration point for the Cervantes config system |
| [`02-auth-backend.md`](./02-auth-backend.md) | Firebase ID token verification in FastAPI using dependencies, role-based access control with custom claims, and user creation from the backend |
| [`03-auth-frontend.md`](./03-auth-frontend.md) | Next.js Firebase client setup, email/password and Google sign-in flows, AuthContext provider, API client helper for passing ID tokens to the backend |
| [`04-firestore-python.md`](./04-firestore-python.md) | Async Firestore CRUD operations, transactions, batch writes, subcollections, pagination, and a mapping table from SQLAlchemy patterns to Firestore equivalents |
| [`05-data-modeling.md`](./05-data-modeling.md) | Firestore data model design for all Cervantes entities (professors, students, classes, arcs, scenes, traces), index configuration, security rules sketch, and denormalization strategy |
| [`06-known-issues.md`](./06-known-issues.md) | Async compatibility details, token verification edge cases, Firestore performance limits, migration pitfalls from SQL, CORS notes, cold start issues, emulator setup, and pricing |
| [`07-gcp-integration.md`](./07-gcp-integration.md) | Firebase/GCP project relationship, using $300 free trial credits, service account management for local/Docker/Cloud Run, Firebase CLI setup, and project structure after integration |

---

## Quick Start (When Ready to Implement)

1. Read `01-admin-sdk-setup.md` -- set up Firebase project and download service account key
2. Read `07-gcp-integration.md` -- understand how it fits with existing GCP/Gemini setup
3. Read `05-data-modeling.md` -- agree on Firestore schema before writing code
4. Implement backend auth (`02-auth-backend.md`) and frontend auth (`03-auth-frontend.md`) in parallel
5. Migrate database operations using `04-firestore-python.md` patterns
6. Review `06-known-issues.md` before going to production
