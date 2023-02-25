#!/usr/bin/env -S just --justfile


DISTFILE := "wiki.zip"

venv := ".tox/" + `grep envdir tox.ini | sed 's#.*/##' `

default:
    @just --list

# build js files
jsfiles:
	sh ./makevueApps.sh
	./node_modules/.bin/rollup -c rollup.config.js

# build js files and watch for changes
watch:
	./node_modules/.bin/rollup -c rollup.config.js -w

# only build vue apps (don't build JS)
vueapps: dev
	./makevueApps.sh

# install NPM packages
dev:
	npm i @vue/compiler-sfc
	npm i @babel/preset-env
	npm install

# cleanup build files
clean:
	make dist
	rm -fr venv
	rm -fr {{venv}}
	rm -fr dist
	rm -fr src/*/*.vue
	rm -fr src/*.vue
	rm -fr {{DISTFILE}}

# run the server
serve: venv
	{{venv}}/bin/uvicorn wirikiki.routes:app --reload --port 8000 --log-level=debug

venv:
	tox
#	python -m venv venv
#	./venv/bin/python setup.py install
#	./scripts/fix_top_level.py venv

dist: vueapps
	DIST=1 make jsfiles

test:
	{{venv}}/bin/mypy wirikiki

