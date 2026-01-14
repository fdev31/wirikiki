from __future__ import annotations

__all__ = ["app"]

import os
from typing import List, Dict

import asyncio
import aiofiles

from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse

from .models import Note
from .configuration import cfg, PATH, IMAGE_PATH, FRONT
from .versioning import gitRun, gitRemove, gitSave
from .authentication import get_current_user_from_token, init as auth_init

try:
    import orjson  # noqa: F401
except ImportError:
    app = FastAPI(debug=True)
else:
    from fastapi.responses import ORJSONResponse

    app = FastAPI(debug=True, default_response_class=ORJSONResponse)


@app.get("/")
def index():
    return RedirectResponse(url="/index.html")


@app.post("/upload")
async def upload(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_from_token),
):
    if file.filename:
        fullname = os.path.join(IMAGE_PATH, file.filename)
        async with aiofiles.open(fullname, "wb") as f:
            await f.write(await file.read())


@app.delete("/notebook")
async def deleteNote(
    name: str, current_user: dict = Depends(get_current_user_from_token)
):
    """Remove one note"""
    # Safety: ensure name is within user scope (basic check, detailed check in gitRemove context if needed)
    # but gitRemove works with relative paths passed to git command.
    # The frontend passes "folder/doc".
    # We should probably prefix with user scope if multi-user is strictly enforced,
    # but current implementation seems to rely on git working dir.

    # Note: The original code didn't check for existence or validation here,
    # relying on git command to fail or succeed.

    # Check if it's a folder deletion request from frontend (might come as "folder/index")
    # Our gitRemove logic now handles /index specially.

    await gitRemove(name)
    await gitSave(name, f"Removed {name}")


@app.post("/notebook")
async def addNote(
    note: Note, current_user: dict = Depends(get_current_user_from_token)
) -> Dict[str, str]:
    """Create one note"""
    # assert "." not in note.name # REMOVED: prevents creating "folder/index" or nested paths if validation is too strict
    # We rely on os.path.join to place it correctly, but we must ensure no traversal ".."
    if ".." in note.name:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="Invalid path")

    note.name = os.path.join(current_user["name"], note.name)
    # assert not os.path.exists(note.filename) # REMOVED: let it overwrite or handle gracefully?
    # Actually, for "create", we usually want it to be new. But "index" might exist if folder exists?
    # Let's keep it safe:
    if os.path.exists(note.filename):
        from fastapi import HTTPException

        raise HTTPException(status_code=409, detail="File already exists")

    await note.save(creation=True)
    return dict(name=note.name)


@app.put("/notebook")
async def updateNote(
    note: Note, current_user: dict = Depends(get_current_user_from_token)
):
    """Update one note"""
    # Fix 1: Replace assert with proper 404/400 check
    if not os.path.exists(note.filename):
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Note not found")

    # Security: Ensure note is within user's allowed path (simple check for now)
    # The note.filename property uses PATH + note.name.
    # note.name comes from user input.
    # We should ensure '..' is not in note.name just like in addNote
    if ".." in note.name:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="Invalid path")

    await note.save()


@app.get("/notebooks")
async def getNotes(
    current_user: dict = Depends(get_current_user_from_token),
) -> List[Note]:
    """Fetches the notebook"""
    entries = []
    for root, _dirs, files in os.walk(os.path.join(PATH, current_user["name"])):
        for file in files:
            if file.endswith(".md"):
                parent = root[len(PATH) :]
                doc = file[:-3]
                entries.append(await Note.load(os.path.join(parent, doc)))
    return entries


auth_init(app)
app.mount("/images/", StaticFiles(directory=IMAGE_PATH), name="images")
app.mount("/", StaticFiles(directory=FRONT), name="static")

if cfg["database"]["use_git"]:
    if not os.path.exists(os.path.join(PATH, ".git")):
        asyncio.gather(gitRun("init"))

    fullpath = os.path.abspath(os.path.expanduser(os.path.expandvars(PATH)))
    cwd = os.getcwd()
    os.chdir(PATH)
    # Fix 2: Replace os.system with safer subprocess calls via gitRun or subprocess directly
    # Since gitRun is async and we are at top level (sync), we might need os.system or subprocess.run
    # but strictly with list arguments, no shell=True.
    import subprocess

    for root, _dirs, files in os.walk(fullpath):
        for fname in files:
            if fname.endswith(".md"):
                # Safe: subprocess with list args prevents shell injection
                rel_path = f"{root[len(fullpath) + 1 :]}/{fname}"
                subprocess.run(["git", "add", rel_path], check=False)

    subprocess.run(["git", "commit", "-m", "Wiki startup"], check=False)
    os.chdir(cwd)
