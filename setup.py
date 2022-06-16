#!/usr/bin/env python

from setuptools import setup

setup(
    name="wirikiki",
    version="1.0",
    description="A tiny desktop wiki",
    author="Fabien Devaux",
    url="http://github.com/fdev31/wirikiki/",
    packages=["wirikiki"],
    scripts=["scripts/wirikiki", "scripts/wirikiki-pwgen"],
    install_requires=open("require.txt").read().split(),
)
