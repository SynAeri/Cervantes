# Unit tests for file parser utilities (extension detection, text extraction)

import pytest
from app.backend.core.file_parser import _get_extension, ALLOWED_EXTENSIONS


@pytest.mark.unit
class TestGetExtension:
    """Tests for _get_extension helper."""

    def test_pdf_extension(self):
        assert _get_extension("rubric.pdf") == ".pdf"

    def test_docx_extension(self):
        assert _get_extension("rubric.docx") == ".docx"

    def test_txt_extension(self):
        assert _get_extension("rubric.txt") == ".txt"

    def test_uppercase_normalized(self):
        assert _get_extension("RUBRIC.PDF") == ".pdf"

    def test_no_extension(self):
        assert _get_extension("rubric") == ""

    def test_multiple_dots(self):
        assert _get_extension("my.rubric.v2.pdf") == ".pdf"

    def test_empty_filename(self):
        assert _get_extension("") == ""

    def test_dot_only(self):
        assert _get_extension(".hidden") == ".hidden"


@pytest.mark.unit
class TestAllowedExtensions:
    """Verify allowed extension set is correct."""

    def test_pdf_allowed(self):
        assert ".pdf" in ALLOWED_EXTENSIONS

    def test_docx_allowed(self):
        assert ".docx" in ALLOWED_EXTENSIONS

    def test_txt_allowed(self):
        assert ".txt" in ALLOWED_EXTENSIONS

    def test_exe_not_allowed(self):
        assert ".exe" not in ALLOWED_EXTENSIONS

    def test_py_not_allowed(self):
        assert ".py" not in ALLOWED_EXTENSIONS
