# Firebase + Google Cloud Platform Integration

> GCP project relationship, credits, and service account management.
> Last updated: 2026-04-04

---

## Firebase = GCP Project with Extra Config

A Firebase project IS a Google Cloud project. Specifically:

- Every Firebase project has a corresponding GCP project with the same project ID
- IAM roles and permissions are shared between Firebase Console and GCP Console
- Billing is unified -- one billing account covers both Firebase and GCP services
- You can add Firebase to an existing GCP project, or create a new one through Firebase Console

The Cervantes project likely already has a GCP project (for Gemini API access via `google-generativeai`). You can add Firebase to that same project.

---

## Using Firebase with GCP $300 Credits

### How It Works

1. Sign up for the GCP Free Trial at [console.cloud.google.com/freetrial](https://console.cloud.google.com/freetrial)
2. You get **$300 in credits** valid for **90 days**
3. Link this billing account to your Firebase project by upgrading to the **Blaze plan** (pay-as-you-go)
4. All Firebase usage is charged against the $300 credits
5. You will NOT be charged real money until the credits run out AND you explicitly upgrade

### What the Credits Cover

- Firestore reads, writes, storage
- Firebase Authentication (free for most providers; Phone Auth has costs)
- Cloud Storage (for rubric PDFs, DOCX uploads)
- Cloud Functions (if used)
- Gemini API calls (already being used)
- Any other GCP service

### Free Tier (Always Free, No Credits Needed)

Even without credits, Firebase Spark plan includes:
- **50K Firestore reads/day**, 20K writes/day, 20K deletes/day
- **1 GiB Firestore storage**
- **10K Authentication verifications/month**
- **5 GB Cloud Storage**

For development, you likely will not exceed the free tier.

### Monitoring Costs

- GCP Console > Billing > Reports: shows spend by service
- Firebase Console > Usage and billing: Firebase-specific breakdown
- Set budget alerts at $50 and $100 to avoid surprise charges

---

## Adding Firebase to an Existing GCP Project

If the Cervantes project already uses GCP (for Gemini):

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Select the existing GCP project from the dropdown
4. Follow the setup wizard (enable Analytics or skip)
5. Done -- Firebase services are now available on that project

The existing GCP service accounts and APIs remain untouched. Firebase adds its own service accounts alongside them.

---

## Service Accounts

### Auto-Created Service Accounts

When you add Firebase, these are created automatically:

| Service Account | Email Pattern | Purpose |
|----------------|---------------|---------|
| Firebase Admin SDK | `firebase-adminsdk-xxxxx@PROJECT_ID.iam.gserviceaccount.com` | Backend SDK operations |
| Firebase Service Management | `service-PROJECT_NUMBER@gcp-sa-firebase.iam.gserviceaccount.com` | Internal Firebase management |
| App Engine default | `PROJECT_ID@appspot.gserviceaccount.com` | Firestore, Storage, scheduled functions |

### Which Service Account to Use

**For local development (your machine, Docker):**
- Download the **Firebase Admin SDK** service account key
- Firebase Console > Project Settings > Service Accounts > "Generate New Private Key"
- This gives you a JSON file for `credentials.Certificate()`

**For GCP-hosted environments (Cloud Run, App Engine):**
- Use **Application Default Credentials** -- no JSON file needed
- The environment automatically provides credentials
- `firebase_admin.initialize_app()` with no arguments

**For CI/CD (GitHub Actions):**
- Store the service account JSON as a GitHub Secret
- Decode it at runtime:

```yaml
# .github/workflows/deploy.yml
env:
  GOOGLE_APPLICATION_CREDENTIALS: /tmp/sa-key.json

steps:
  - name: Write service account key
    run: echo '${{ secrets.FIREBASE_SA_KEY }}' > /tmp/sa-key.json
```

---

## Docker Configuration

### Development (docker-compose)

```yaml
# docker-compose.yml
services:
  backend:
    build: ./app/backend
    environment:
      - GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccountKey.json
    volumes:
      - ./serviceAccountKey.json:/app/serviceAccountKey.json:ro
    ports:
      - "8000:8000"
```

### Production (Cloud Run)

No service account file needed. Cloud Run uses the project's default service account:

```bash
gcloud run deploy cervantes-backend \
  --source ./app/backend \
  --region us-central1 \
  --allow-unauthenticated
```

The deployed service automatically has access to Firestore, Auth, and Storage.

---

## Environment Variable Strategy

### Local Development

```env
# app/backend/.env
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
GEMINI_API_KEY=AIza...
FIREBASE_PROJECT_ID=cervantes-xxxxx
```

### Docker

```env
GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccountKey.json
GEMINI_API_KEY=AIza...
```

### Cloud Run / Production

```env
# No GOOGLE_APPLICATION_CREDENTIALS needed (auto-detected)
GEMINI_API_KEY=AIza...  # stored in Secret Manager
```

---

## Firebase CLI Setup

```bash
npm install -g firebase-tools
firebase login
firebase init  # select Firestore, Auth, Storage, Emulators
```

This creates:
- `firebase.json` -- project configuration
- `firestore.rules` -- security rules
- `firestore.indexes.json` -- composite index definitions
- `.firebaserc` -- project alias

Deploy rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Project Structure After Firebase Integration

```
Cervantes/
  app/
    backend/
      core/
        firebase.py          # NEW: Firebase init + get_db()
        config.py             # Updated: add Firebase env vars
      ...
  teacher-dashboard/
    lib/
      firebase.ts            # NEW: Firebase client init
    contexts/
      AuthContext.tsx         # NEW: Auth state management
    .env.local               # NEW: Firebase client config
  student-dashboard/
    lib/
      firebase.ts            # NEW: Firebase client init (same config)
    contexts/
      AuthContext.tsx         # NEW: Auth state management
    .env.local               # NEW: Firebase client config
  firebase.json              # NEW: Firebase project config
  firestore.rules            # NEW: Security rules
  firestore.indexes.json     # NEW: Index definitions
  .firebaserc                # NEW: Project alias
  serviceAccountKey.json     # NEW: (gitignored) Admin SDK key
```

---

## Gemini API Coexistence

The current backend uses `google-generativeai` for Gemini. This coexists fine with `firebase-admin`:

- Both use GCP credentials but for different services
- `google-generativeai` uses `GEMINI_API_KEY` (API key auth)
- `firebase-admin` uses a service account (IAM auth)
- No conflicts -- they are independent SDKs

---

## Sources

- [Firebase & Google Cloud (Official)](https://firebase.google.com/firebase-and-gcp)
- [Use Firebase with Existing GCP Project (Official)](https://firebase.google.com/docs/projects/use-firebase-with-existing-cloud-project)
- [Firebase Service Accounts Overview (Official)](https://firebase.google.com/support/guides/service-accounts)
- [Get Started with Firebase Using Free Trial Credits (Firebase Blog)](https://firebase.blog/posts/2024/11/claim-300-to-get-started/)
- [Firebase + GCP Relationship (Medium)](https://medium.com/google-developers/whats-the-relationship-between-firebase-and-google-cloud-57e268a7ff6f)
- [Firebase GCP Integration (OneUptime)](https://oneuptime.com/blog/post/2026-01-24-firebase-gcp-integration/view)
