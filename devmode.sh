#!/bin/sh

make
echo "BUILT"
make watch &
sleep 1
echo "UNDER WATCH"
make serve &


WATCHED=""

for path in $(find src -name "vue_*"); do
    WATCHED="${WATCHED} $(ls $path/*)"
done

while true; do
    inotifywait -q -e MODIFY ${WATCHED}
    make vueapps
done
