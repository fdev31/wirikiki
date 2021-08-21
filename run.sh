#!/bin/sh
if which chrome 2>/dev/null ; then
    CHROME=chrome
else
    CHROME=chromium
fi
if [ ! -d venv ]; then
    python -m venv venv
    ./venv/bin/pip install -r require.txt
fi

./venv/bin/uvicorn server:app --port 8000
$CHROME --app="http://localhost:8000" --new-window
