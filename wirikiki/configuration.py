__all__ = ["cfg", "IMAGE_PATH", "PATH"]

import os
from typing import Dict, Any
import tomli

config_fname = os.environ.get("CFG_FILE", os.path.join(os.path.curdir, "settings.toml"))
cfg: Dict[str, Dict[str, Any]] = tomli.load(open(config_fname, "rb"))
PATH = os.environ.get("DBDIR", cfg["database"]["directory"])

if not os.path.exists(PATH):
    PATH = os.path.curdir

if not PATH.endswith(os.path.sep):
    PATH += os.path.sep

IMAGE_PATH = os.path.join(PATH, "images")

if not os.path.exists(IMAGE_PATH):
    os.mkdir(IMAGE_PATH)
