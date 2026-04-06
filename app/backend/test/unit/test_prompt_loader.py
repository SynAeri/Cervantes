# Unit tests for prompt loader (file discovery and loading)

import pytest
from pathlib import Path
from app.backend.core.prompt_loader import (
    load_system_prompt,
    load_example_prompt,
    load_annotation,
    load_curricullm_prompt,
    PROMPTS_DIR,
)


@pytest.mark.unit
class TestPromptsDirectoryExists:
    """Verify the prompts directory and subdirectories exist."""

    def test_prompts_dir_exists(self):
        assert PROMPTS_DIR.exists(), f"Prompts directory not found: {PROMPTS_DIR}"

    def test_system_dir_exists(self):
        assert (PROMPTS_DIR / "system").exists()

    def test_examples_dir_exists(self):
        assert (PROMPTS_DIR / "examples").exists()

    def test_annotations_dir_exists(self):
        assert (PROMPTS_DIR / "annotations").exists()

    def test_curricullm_dir_exists(self):
        assert (PROMPTS_DIR / "curricullm").exists()


@pytest.mark.unit
class TestLoadSystemPrompt:
    """Tests for loading system prompts."""

    def test_load_existing_prompt(self):
        # Find any .md file in system/ to test with
        system_dir = PROMPTS_DIR / "system"
        prompts = list(system_dir.glob("*.md"))
        if not prompts:
            pytest.skip("No system prompts found")
        name = prompts[0].stem
        content = load_system_prompt(name)
        assert isinstance(content, str)
        assert len(content) > 0

    def test_load_nonexistent_prompt_raises(self):
        with pytest.raises(FileNotFoundError, match="System prompt not found"):
            load_system_prompt("nonexistent_prompt_xyz")


@pytest.mark.unit
class TestLoadExamplePrompt:

    def test_load_nonexistent_raises(self):
        with pytest.raises(FileNotFoundError, match="Example prompt not found"):
            load_example_prompt("nonexistent_example_xyz")


@pytest.mark.unit
class TestLoadAnnotation:

    def test_load_nonexistent_raises(self):
        with pytest.raises(FileNotFoundError, match="Annotation file not found"):
            load_annotation("nonexistent_annotation_xyz")


@pytest.mark.unit
class TestLoadCurricullmPrompt:

    def test_load_nonexistent_raises(self):
        with pytest.raises(FileNotFoundError, match="CurricuLLM prompt not found"):
            load_curricullm_prompt("nonexistent_curricullm_xyz")

    def test_load_existing_prompt(self):
        curricullm_dir = PROMPTS_DIR / "curricullm"
        prompts = list(curricullm_dir.glob("*.md"))
        if not prompts:
            pytest.skip("No CurricuLLM prompts found")
        name = prompts[0].stem
        content = load_curricullm_prompt(name)
        assert isinstance(content, str)
        assert len(content) > 0
