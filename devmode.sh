#!/bin/sh

make vueapps
make serve &
make watch &

WATCHED=""

for path in $(find src -name "vue_*"); do
    WATCHED="${WATCHED} $(ls $path/*)"
done

while true; do
    inotifywait -q -e MODIFY ${WATCHED}
    make vueapps
done
