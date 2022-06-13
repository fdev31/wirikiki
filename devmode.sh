#!/bin/sh
SOUND="/usr/share/sounds/freedesktop/stereo/complete.oga"
SOUND_KO="/usr/share/sounds/freedesktop/stereo/dialog-warning.oga"

make vueapps
echo "BUILT"
make watch &
sleep 1
echo "UNDER WATCH"
make serve &


WATCHED="src/lib/ src/main"

for path in $(find src -name "vue_*"); do
    WATCHED="${WATCHED} $(ls $path/*)"
done

while true; do
    inotifywait -q -e MODIFY ${WATCHED}
    make && play $SOUND || play $SOUND_KO
done
