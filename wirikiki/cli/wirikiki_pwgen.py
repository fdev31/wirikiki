#!/bin/env python
import sys
from wirikiki.authentication import make_password


def run():
    print(make_password(sys.argv[1]))


if __name__ == "__main__":
    run()