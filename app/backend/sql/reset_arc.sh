#!/bin/bash
# Quick reset script for arc development
# Run from anywhere in the project

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Resetting arc and scene data..."
docker exec -i cervantes-db psql -U postgres -d cervantes < "$SCRIPT_DIR/reset_arcs.sql"
echo "✓ Database reset complete. Ready for new arc generation."
