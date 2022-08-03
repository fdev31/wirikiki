__all__ = ["cfg", "IMAGE_PATH", "PATH", "USERS"]

import os
from string import Template
from typing import Dict, Any

import tomli

config_fname = os.environ.get("CFG_FILE", os.path.join(os.path.curdir, "settings.toml"))

try:
    cfg: Dict[str, Dict[str, Any]] = tomli.load(open(config_fname, "rb"))
except FileNotFoundError:
    print(
        "Can't find settings.toml in the current folder, set CFG_FILE in the environment and try again"
    )
    raise SystemExit(-1)

PATH = os.environ.get(
    "DBDIR",
    Template(cfg["database"]["directory"]).substitute(data=cfg["general"]["base_dir"]),
)

USERS = Template(cfg["users"]["database"]).substitute(data=cfg["general"]["base_dir"])

if not os.path.exists(PATH):
    PATH = os.path.curdir

if not PATH.endswith(os.path.sep):
    PATH += os.path.sep

IMAGE_PATH = os.path.join(PATH, "images")

if not os.path.exists(IMAGE_PATH):
    os.mkdir(IMAGE_PATH)
