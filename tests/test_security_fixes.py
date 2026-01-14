import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from wirikiki.routes import addNote, updateNote, deleteNote
from wirikiki.models import Note
from fastapi import HTTPException
import os

# Mock the configuration
with (
    patch("wirikiki.routes.cfg", {"database": {"use_git": True}}),
    patch("wirikiki.routes.PATH", "/tmp/mock_path"),
):

    @pytest.mark.asyncio
    async def test_add_note_validation():
        """Test input validation for addNote"""

        # Test 1: Path Traversal Attempt
        bad_note = Note(name="../bad_path", content="malicious")
        user = {"name": "test_user"}

        with pytest.raises(HTTPException) as exc:
            await addNote(bad_note, user)
        assert exc.value.status_code == 400
        assert exc.value.detail == "Invalid path"

    @pytest.mark.asyncio
    async def test_update_note_validation():
        """Test input validation for updateNote (current state uses assert)"""
        # Note: This test currently expects the 'assert' behavior or failure
        # We are writing this BEFORE the fix to confirm current behavior (or lack thereof)
        # But since we are mocking, we can simulate the fix we intend to make
        pass

    @pytest.mark.asyncio
    async def test_startup_command_injection_check():
        """
        Verify that we don't use os.system in the startup block.
        We can't easily run the startup block in isolation here without refactoring,
        but we can inspect the source or write a test that mocks os.system
        and ensures it's NOT called with user input if we were to trigger it.
        For now, this is a placeholder to remind us to fix line 130/131 in routes.py
        """
        pass
