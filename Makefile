.PHONY: jsfiles serve clean dev vueapps watch
DISTFILE=wiki.zip
DIST_DIR:=$(shell python -c "import os; print('wirikiki-' + os.name)")

all: jsfiles venv

jsfiles:
	sh ./makevueApps.sh
	./node_modules/.bin/rollup -c rollup.config.js

watch:
	./node_modules/.bin/rollup -c rollup.config.js -w

vueapps: dev
	./makevueApps.sh

dev:
	npm i '@vue/compiler-sfc'
	npm i @babel/preset-env
	npm install

clean:
	make dist
	rm -fr venv
	rm -fr .tox
	rm -fr dist
	rm -fr src/*/*.vue
	rm -fr src/*.vue
	rm -fr ${DISTFILE}

serve: venv
	./.tox/py310/bin/uvicorn wirikiki.routes:app --reload --port 8000 --log-level=debug

venv: .tox

.tox:
	tox
#	python -m venv venv
#	./venv/bin/python setup.py install
#	./scripts/fix_top_level.py venv

dist: vueapps
	DIST=1 make jsfiles
