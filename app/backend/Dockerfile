FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY app/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and prompts (both needed at runtime)
COPY app/backend ./app/backend
COPY app/prompts ./app/prompts
COPY app/__init__.py ./app/__init__.py

# Set PYTHONPATH so imports like "app.backend.core..." resolve
ENV PYTHONPATH=/app
ENV PORT=8080

EXPOSE 8080

# Cloud Run sets PORT env var; no --reload in production
CMD exec uvicorn app.backend.main:app --host 0.0.0.0 --port ${PORT}
