import pytest
from unittest.mock import patch, MagicMock
from wirikiki.routes import updateNote, Note
from fastapi import HTTPException

# Mock configurations again for this test file
with (
    patch("wirikiki.routes.cfg", {"database": {"use_git": True}}),
    patch("wirikiki.routes.PATH", "/tmp/mock_path"),
):

    @pytest.mark.asyncio
    async def test_update_note_not_found():
        """Test that updating a non-existent note returns 404 instead of 500/AssertionError"""

        # Mock os.path.exists to return False
        with patch("os.path.exists", return_value=False):
            note = Note(name="non_existent", content="foo")
            user = {"name": "test"}

            with pytest.raises(HTTPException) as exc:
                await updateNote(note, user)

            assert exc.value.status_code == 404
            assert exc.value.detail == "Note not found"

    @pytest.mark.asyncio
    async def test_update_note_traversal():
        """Test that path traversal in update is caught"""

        # Mock os.path.exists to return True (to bypass the 404 check)
        with patch("os.path.exists", return_value=True):
            note = Note(name="../secret", content="hack")
            user = {"name": "test"}

            with pytest.raises(HTTPException) as exc:
                await updateNote(note, user)

            assert exc.value.status_code == 400
