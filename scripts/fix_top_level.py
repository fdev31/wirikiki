#!/bin/env python

import sys
import os

for root, dirs, files in os.walk(sys.argv[1]):
    for folder in dirs:
        if folder == "EGG-INFO":
            top_level_file = os.path.join(root, folder, "top_level.txt")
            if not os.path.exists(top_level_file):
                name = os.path.split(root)[-1].split("-", 1)[0]
                open(top_level_file, "w").write(name)
