.PHONY: jsfiles serve clean dev vueapps watch
DISTFILE=wiki.zip

ARCHIVE=server/__init__.py apps require.txt run.sh myKB/Intro.md scripts/wirikiki setup.py

all: jsfiles venv

jsfiles:
	sh ./makevueApps.sh
	./node_modules/.bin/rollup -c rollup.config.js

freeze:
	./venv/bin/pip install pyinstaller
	./venv/bin/pyinstaller scripts/wirikiki --add-data apps:apps --add-data myKB/Intro.md:myKB/Intro.md --add-data myKB/images/.keep_me:myKB/images/.keep_me -w -p . --collect-submodules server -F

watch:
	./node_modules/.bin/rollup -c rollup.config.js -w

vueapps: dev
	./makevueApps.sh

dev:
	npm install

clean:
	rm -fr apps/*.js apps/*.css apps/*.map
	rm -fr venv
	rm -fr dist
	rm -fr src/*/*.vue
	rm -fr ${DISTFILE}

serve: venv
	./venv/bin/uvicorn server:app --reload --port 8000 --log-level=debug

venv:
	python -m venv venv
	./venv/bin/python setup.py install

dist: vueapps
	make clean
	DIST=1 make jsfiles
	rm -fr apps/*.map
	zip -9r ${DISTFILE} ${ARCHIVE}
