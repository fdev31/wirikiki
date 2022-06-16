from typing import Optional
from fastapi import HTTPException, status, Depends
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import timedelta, datetime
from jose import JWTError, jwt  # type: ignore

from .configuration import cfg


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    data_copy = data.copy()
    expire = datetime.utcnow() + (
        expires_delta
        if expires_delta
        else timedelta(minutes=cfg["token"]["expire_minutes"])
    )
    data_copy.update({"exp": expire})
    return jwt.encode(
        data_copy, cfg["token"]["key"], algorithm=cfg["token"]["algorithm"]
    )


def get_user_db():
    return cfg["users"]


class Token(BaseModel):
    access_token: str
    token_type: str


credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


def get_current_user_from_token(
    token: str = Depends(oauth2_scheme), db: dict = Depends(get_user_db)
):
    try:
        payload = jwt.decode(
            token, cfg["token"]["key"], algorithms=[cfg["token"]["algorithm"]]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.get(username)
    if user is None:
        raise credentials_exception
    return dict(name=username)


def init(application):
    def _login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: dict = Depends(get_user_db),
    ):
        if db.get(form_data.username) == form_data.password:
            access_token = create_access_token(
                data={"sub": form_data.username},
            )
            return {"access_token": access_token, "token_type": "bearer"}
        else:
            raise credentials_exception

    application.post("/token", response_model=Token)(_login_for_access_token)
