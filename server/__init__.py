from __future__ import annotations

ALLOW_FOLDERS = True
DEFAULT_DBDIR = "./myKB/"

import os
from pydantic import BaseModel
from typing import List, Optional

import asyncio
import aiofiles

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse
from fastapi.responses import ORJSONResponse


class Settings:
    ALGORITHM = "HS256"
    SECRET_KEY = "kHi37vNk93Dd1LgieCGk+d1axrrQYJ6bM4OEqtu78HA="
    ACCESS_TOKEN_EXPIRE_MINUTES = 60.0 * 36  # 36 hours


try:
    import orjson
except ImportError:
    app = FastAPI(debug=True)
else:
    app = FastAPI(debug=True, default_response_class=ORJSONResponse)

PATH = os.environ.get("DBDIR", DEFAULT_DBDIR)

if not os.path.exists(PATH):
    PATH = os.path.curdir

if not PATH.endswith(os.path.sep):
    PATH += os.path.sep

IMAGE_PATH = os.path.join(PATH, "images")

if not os.path.exists(IMAGE_PATH):
    os.mkdir(IMAGE_PATH)

USE_GIT = os.path.exists(os.path.join(PATH, ".git"))


# AUTHENTICATION

from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import timedelta, datetime
from jose import JWTError, jwt  # type: ignore


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, Settings.SECRET_KEY, algorithm=Settings.ALGORITHM
    )
    return encoded_jwt


def get_db():
    return {
        "fab": "pass",
    }


class Token(BaseModel):
    access_token: str
    token_type: str


credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
)


@app.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: dict = Depends(get_db)
):
    if db.get(form_data.username) == form_data.password:
        access_token_expires = timedelta(minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": form_data.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise credentials_exception


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


def get_current_user_from_token(
    token: str = Depends(oauth2_scheme), db: dict = Depends(get_db)
):
    try:
        payload = jwt.decode(
            token, Settings.SECRET_KEY, algorithms=[Settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        print("username/email extracted is ", username)
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.get(username)
    if user is None:
        raise credentials_exception
    return dict(name=username)


# END OF AUTHENTICATION CODE


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

    async def save(self, creation=False):
        if creation and ALLOW_FOLDERS:
            rootDir = os.path.dirname(self.filename)
            if not os.path.exists(rootDir):
                os.makedirs(rootDir, exist_ok=True)
        async with aiofiles.open(self.filename, "w", encoding="utf-8") as f:
            await f.write(self.content)
        if creation:
            await gitAdd(self.name)
        await gitSave(
            self.name,
            f"Udated {self.name}" if not creation else f"NEW note: {self.name}",
        )


@app.get("/")
def index():
    return RedirectResponse(url="/index.html")


@app.post(
    "/upload",
)
async def upload(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_from_token),
):
    fullname = os.path.join(IMAGE_PATH, file.filename)
    async with aiofiles.open(fullname, "wb") as f:
        await f.write(await file.read())


@app.delete("/notebook")
async def deleteNote(
    name: str, current_user: dict = Depends(get_current_user_from_token)
):
    """Remove one note"""
    await gitRemove(name)
    await gitSave(name, f"Removed {name}")


@app.post("/notebook")
async def addNote(
    note: Note, current_user: dict = Depends(get_current_user_from_token)
):
    """Create one note"""
    assert "." not in note.name
    assert not os.path.exists(note.filename)
    await note.save(creation=True)


@app.put("/notebook")
async def updateNote(
    note: Note, current_user: dict = Depends(get_current_user_from_token)
):
    """Update one note"""
    assert os.path.exists(note.filename)
    await note.save()


@app.get("/notebooks")
async def getNotes(
    current_user: dict = Depends(get_current_user_from_token),
) -> List[Note]:
    """Fetches the notebook"""
    entries = []
    for root, _dirs, files in os.walk(PATH):
        for file in files:
            if file.endswith(".md"):
                parent = root[len(PATH) :]
                doc = file[:-3]
                entries.append(await Note.load(os.path.join(parent, doc)))
    return entries


app.mount("/images/", StaticFiles(directory=IMAGE_PATH), name="images")
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
