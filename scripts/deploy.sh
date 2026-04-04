#!/usr/bin/env bash
# Deploy Cervantes backend to Google Cloud Run
# Usage: ./scripts/deploy.sh [--env-file path/to/.env]
#
# This script is idempotent — safe to run multiple times.

set -euo pipefail

PROJECT_ID="cervantes-caebc"
REGION="australia-southeast1"
SERVICE_NAME="cervantes-backend"
REPO_NAME="cervantes"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME"
SERVICE_ACCOUNT="cervantes-backend@$PROJECT_ID.iam.gserviceaccount.com"

# Parse arguments
ENV_FILE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# Navigate to project root (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "=== Cervantes Cloud Run Deployment ==="
echo "Project:  $PROJECT_ID"
echo "Region:   $REGION"
echo "Service:  $SERVICE_NAME"
echo ""

# 1. Enable required APIs
echo "--- Enabling required GCP APIs ---"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID" \
  --quiet

# 2. Create Artifact Registry repo if it doesn't exist
echo "--- Ensuring Artifact Registry repo exists ---"
if ! gcloud artifacts repositories describe "$REPO_NAME" \
    --location="$REGION" \
    --project="$PROJECT_ID" &>/dev/null; then
  echo "Creating Artifact Registry repo: $REPO_NAME"
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --description="Cervantes Docker images"
else
  echo "Artifact Registry repo '$REPO_NAME' already exists."
fi

# 3. Configure Docker auth for Artifact Registry
echo "--- Configuring Docker auth ---"
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

# 4. Build the image
echo "--- Building Docker image ---"
docker build \
  -t "$IMAGE:latest" \
  -f app/backend/Dockerfile \
  .

# 5. Push the image
echo "--- Pushing Docker image ---"
docker push "$IMAGE:latest"

# 6. Prepare env vars for Cloud Run
ENV_VARS="FIREBASE_PROJECT_ID=$PROJECT_ID"

# Load env vars from .env file if provided
if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  echo "--- Loading env vars from $ENV_FILE ---"
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ -z "$key" || "$key" == \#* ]] && continue
    # Strip surrounding quotes from value
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    # Skip GOOGLE_APPLICATION_CREDENTIALS (Cloud Run uses metadata server)
    [[ "$key" == "GOOGLE_APPLICATION_CREDENTIALS" ]] && continue
    # Skip DATABASE_URL (using Firestore in production)
    [[ "$key" == "DATABASE_URL" ]] && continue
    ENV_VARS="$ENV_VARS,$key=$value"
  done < "$ENV_FILE"
fi

# 7. Deploy to Cloud Run
echo "--- Deploying to Cloud Run ---"
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --service-account="$SERVICE_ACCOUNT" \
  --set-env-vars="$ENV_VARS"

# 8. Grant Cloud Run invoker role (idempotent)
echo "--- Ensuring IAM permissions ---"
gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --quiet 2>/dev/null || true

# 9. Print service URL
echo ""
echo "=== Deployment complete ==="
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")
echo "Service URL: $SERVICE_URL"
echo "Health check: $SERVICE_URL/health"
