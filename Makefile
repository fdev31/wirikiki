.PHONY: jsfiles serve clean dev vueapps watch
DISTFILE=wiki.zip

ARCHIVE=server.py apps require.txt run.sh myKB/Intro.md

jsfiles:
	sh ./makevueApps.sh
	./node_modules/.bin/rollup -c rollup.config.js

watch:
	./node_modules/.bin/rollup -c rollup.config.js -w

vueapps: dev
	./makevueApps.sh

dev:
	npm install

clean:
	rm -fr apps/*.js apps/*.css apps/*.map
	rm -fr venv
	rm -fr src/*/*.vue
	rm -fr ${DISTFILE}

serve: venv
	./venv/bin/uvicorn server:app --reload --port 8000 --log-level=debug

venv:
	python -m venv venv
	./venv/bin/pip install -r require.txt

dist: vueapps
	make clean
	DIST=1 make jsfiles
	rm -fr apps/*.map
	zip -9r ${DISTFILE} ${ARCHIVE}
