from __future__ import annotations

import os
from pydantic import BaseModel
from typing import List

import asyncio
import aiofiles

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse
from fastapi.responses import ORJSONResponse

try:
    import orjson
except ImportError:
    app = FastAPI(debug=True)
else:
    app = FastAPI(debug=True, default_response_class=ORJSONResponse)

PATH = os.environ.get("DBDIR", "./myKB/")

if not PATH.endswith(os.path.sep):
    PATH += os.path.sep

USE_GIT = os.path.exists(os.path.join(PATH, ".git"))


async def _gitCmd(*args):
    if not USE_GIT:
        return
    cmd_args = ["git", f"--git-dir={PATH}.git", f"--work-tree={PATH}"]
    cmd_args.extend(args)
    proc = await asyncio.create_subprocess_exec(*cmd_args)
    await proc.communicate()


async def gitSave(path, message="backup"):
    await _gitCmd("commit", path + ".md", "-m", message)


async def gitAdd(path):
    await _gitCmd("add", path + ".md")


async def gitRemove(path):
    await _gitCmd("rm", "-f", path + ".md")


class Note(BaseModel):
    "A markdown note"

    name: str
    content: str = ""

    @property
    def exists(self) -> bool:
        return os.path.exists(self.filename)

    @property
    def filename(self) -> str:
        return os.path.join(PATH, self.name) + ".md"

    @staticmethod
    async def load(name) -> Note:
        n = Note(name=name)
        async with aiofiles.open(n.filename, "r", encoding="utf-8") as f:
            n.content = await f.read()
        return n

    async def save(self):
        wasExisting = self.exists
        async with aiofiles.open(self.filename, "w", encoding="utf-8") as f:
            await f.write(self.content)
        if not wasExisting:
            await gitAdd(self.name)
        await gitSave(
            self.name,
            f"Udated {self.name}" if wasExisting else f"NEW note: {self.name}",
        )


@app.get("/")
def index():
    return RedirectResponse(url="/index.html")


@app.delete("/notebook")
async def deleteNote(name: str):
    """Remove one note"""
    await gitRemove(name)
    await gitSave(name, f"Removed {name}")


@app.post("/notebook")
async def addNote(note: Note):
    """Create one note"""
    assert not os.path.exists(note.filename)
    await note.save()


@app.put("/notebook")
async def updateNote(note: Note):
    """Update one note"""
    assert os.path.exists(note.filename)
    await note.save()


@app.get("/notebooks")
async def getNotes() -> List[Note]:
    """Fetches the notebook"""
    entries = []
    for root, _dirs, files in os.walk(PATH):
        for file in files:
            if file.endswith(".md"):
                parent = root[len(PATH) :]
                doc = file[:-3]
                entries.append(await Note.load(os.path.join(parent, doc)))
    return entries


app.mount("/", StaticFiles(directory="apps"), name="static")

if USE_GIT:
    fullpath = os.path.abspath(os.path.expanduser(os.path.expandvars(PATH)))
    cwd = os.getcwd()
    os.chdir(PATH)
    for root, _dirs, files in os.walk(fullpath):
        for fname in files:
            if fname.endswith(".md"):
                os.system(f'git add "{fname}"')
    os.system('git commit -m "Wiki startup"')
    os.chdir(cwd)
