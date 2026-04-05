# Backend Quick Start Guide

The FastAPI backend for La Mancha has been implemented in `/app/backend/`. Here's how to get it running.

## Prerequisites

- Python 3.11+ installed
- PostgreSQL installed

## Setup Steps

### 1. Install PostgreSQL (if not already installed)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE lamancha_db;
CREATE USER lamancha_user WITH PASSWORD 'lamancha_password';
ALTER DATABASE lamancha_db OWNER TO lamancha_user;
GRANT ALL PRIVILEGES ON DATABASE lamancha_db TO lamancha_user;
\q
```

### 3. Install Python Dependencies

```bash
cd /home/jordanm/Documents/Github/LaMancha
pip install -r app/backend/requirements.txt
```

### 4. Initialize Database Tables

```bash
python3 -c "from app.backend.database import engine, Base; from app.backend.models import *; Base.metadata.create_all(bind=engine)"
```

### 5. Start the Backend Server

```bash
cd /home/jordanm/Documents/Github/LaMancha
uvicorn app.backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

## Verify It's Working

### Test Health Endpoint
```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status": "healthy"}
```

### View API Documentation
Open in browser: http://localhost:8000/docs

## Test Arc Generation

Create a file `test_rubric.txt` with sample Economics rubric content, then:

```bash
curl -X POST http://localhost:8000/api/arc/generate \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": "test-class-123",
    "rubric_text": "Economics Year 10\n\nAssessment: Supply and Demand Quiz\n\nStudents must demonstrate understanding of market equilibrium, price elasticity, and consumer surplus.",
    "professor_id": "test-prof-456"
  }'
```

This will:
1. Parse the rubric with CurricuLLM
2. Generate a narrative arc with Gemini
3. Create scenes with characters (Holo, Rhea, Mina, etc.)
4. Store everything in PostgreSQL
5. Return the arc_id

## File Structure Created

```
app/backend/
├── main.py                 # FastAPI app orchestrator
├── config.py               # Environment config
├── database.py             # SQLAlchemy setup
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (DATABASE_URL, GEMINI_API_KEY)
├── README.md               # Detailed backend docs
│
├── models/                 # SQLAlchemy ORM models
│   ├── professor.py
│   ├── student.py
│   ├── class_model.py
│   ├── enrollment.py
│   ├── arc.py             # Arc with curriculum_data, narrative_arc (JSONB)
│   ├── scene.py
│   ├── character.py
│   └── reasoning_trace.py
│
├── schemas/                # Pydantic request/response schemas
│   ├── arc_schemas.py
│   ├── dialogue_schemas.py
│   └── auth_schemas.py
│
├── routes/                 # API endpoint handlers
│   ├── arc_routes.py      # Arc generation, approve, publish
│   └── dialogue_routes.py # Dialogue turn generation
│
└── services/               # Business logic
    ├── prompt_loader.py   # Loads .md files from /app/prompts/
    ├── llm_client.py      # Gemini API wrapper with retry
    ├── arc_generator.py   # Orchestrates arc generation
    └── dialogue_engine.py # Generates Socratic dialogue
```

## API Endpoints

### Arc Management
- `POST /api/arc/generate` - Generate arc from rubric
- `GET /api/arc/{arc_id}` - Get arc details
- `POST /api/arc/{arc_id}/approve` - Approve draft
- `POST /api/arc/{arc_id}/publish` - Publish to students

### Dialogue
- `POST /api/dialogue/turn` - Generate next dialogue response

## Environment Variables

Located in `/app/backend/.env`:

```env
DATABASE_URL=postgresql://lamancha_user:lamancha_password@localhost:5432/lamancha_db
GEMINI_API_KEY=AIzaSyBvm7L4IHHn_WYa1h_5HU9R80f4mp5dNjI
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters-long
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=168
```

## Next Steps

1. **Seed Character Templates**: Create character records (Holo, Rhea, Mina, Lisa, Haru) in the database
2. **Test with Real Rubric**: Upload an Economics rubric through the API
3. **Frontend Integration**: Update Next.js frontends to call these API endpoints
4. **Authentication**: Implement JWT auth for protected routes
5. **Deployment**: Dockerize and deploy to production

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database exists: `sudo -u postgres psql -l`
- Check credentials in `.env` file

### Import Errors
- Ensure you're in the repo root when running commands
- Verify all dependencies installed: `pip list | grep fastapi`

### Gemini API Errors
- Check API key is valid in `.env`
- Verify internet connection
- Check Gemini API quotas/rate limits

## Architecture Notes

This implementation follows the plan approved by Jordan:
- **FastAPI** (Python) for better LLM ecosystem
- **PostgreSQL** for production-ready JSONB support
- **Layer-based organization** (routes/, services/, models/)
- **Object-oriented** with main.py as orchestrator
- All informal comments at top of files per CLAUDE.md conventions
