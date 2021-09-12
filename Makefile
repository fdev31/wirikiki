.PHONY: jsfiles serve clean dev vueapps watch
DISTFILE=wiki.zip
DIST_DIR:=$(shell python -c "import os; print('wirikiki-' + os.name)")

ARCHIVE=server/__init__.py apps require.txt run.sh myKB/Intro.md myKB/README.md scripts/wirikiki setup.py

all: jsfiles venv

jsfiles:
	sh ./makevueApps.sh
	./node_modules/.bin/rollup -c rollup.config.js

freeze:
	rm -fr dist
	./venv/bin/pip install pyinstaller
	./venv/bin/python setup.py install
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
	./scripts/fix_top_level.py venv

dist: vueapps
	rm -fr ${DIST_DIR}
	mkdir ${DIST_DIR}
	make venv
	make freeze
	cp dist/wirikiki ${DIST_DIR}
	make clean
	DIST=1 make jsfiles
	rm -fr apps/*.map
	zip -r tmp.zip ${ARCHIVE}
	(cd ${DIST_DIR} && unzip ../tmp.zip)
	rm -f tmp.zip
	zip -9r ${DISTFILE} ${DIST_DIR}
	rm -fr ${DIST_DIR}
