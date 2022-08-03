#!/bin/sh

if which python3 2>&1 > /dev/null ; then
    PY=python3
else
    PY=python
fi
if which chrome 2>&1 > /dev/null ; then
    CHROME=chrome
elif which google-chrome-stable 2>&1 > /dev/null ; then
    CHROME=google-chrome-stable
else
    CHROME=chromium
fi
if [ ! -d venv ]; then
    $PY -m venv venv
    ./venv/bin/pip install -r require.txt
fi

./venv/bin/uvicorn wirikiki.routes:app --port 8000 --host 0.0.0.0 &
$CHROME --app="http://localhost:8000" --new-window
