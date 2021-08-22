#!/bin/sh
SOUND="/usr/share/sounds/gnome/default/alerts/glass.ogg"

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
    play $SOUND
done
