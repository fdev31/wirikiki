from __future__ import annotations

import os
from pydantic import BaseModel
from typing import List

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

PATH = os.environ.get("DBDIR", "./myKB/")  # WITH trailing slash


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
        async with aiofiles.open(self.filename, "w", encoding="utf-8") as f:
            await f.write(self.content)


@app.get("/")
def index():
    return RedirectResponse(url="/index.html")


@app.delete("/notebook")
def deleteNote(name: str):
    """Remove one note"""
    fname = os.path.join(PATH, name) + ".md"
    os.unlink(fname)


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
