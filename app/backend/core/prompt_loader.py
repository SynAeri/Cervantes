# Loads .md prompt files from /app/prompts/ directory

from pathlib import Path

PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"

def load_system_prompt(name: str) -> str:
    path = PROMPTS_DIR / "system" / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"System prompt not found: {name}")
    return path.read_text(encoding="utf-8")

def load_example_prompt(name: str) -> str:
    path = PROMPTS_DIR / "examples" / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"Example prompt not found: {name}")
    return path.read_text(encoding="utf-8")

def load_annotation(name: str) -> str:
    path = PROMPTS_DIR / "annotations" / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"Annotation file not found: {name}")
    return path.read_text(encoding="utf-8")

def load_curricullm_prompt(name: str) -> str:
    path = PROMPTS_DIR / "curricullm" / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"CurricuLLM prompt not found: {name}")
    return path.read_text(encoding="utf-8")
