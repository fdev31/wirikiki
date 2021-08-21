for path in $(find src -type d -name "vue_*"); do
    echo "Making $path ..."
    appname=${path##*/}
    filename="${appname:4}.vue"
    fullpath="$(dirname $path)/${filename}"

    echo -n "" > "$fullpath"
    for n in $path/* ; do
        ext=${n##*.}
        name=${n%.*}
        name=${name##*/}
        if [ "$name" = "style" ]; then
            echo "<$name lang=\"$ext\">" >> "$fullpath"
        else
            echo "<$name>" >> "$fullpath"
        fi
        cat $n >> "$fullpath"
        echo "</$name>" >> "$fullpath"
    done
done
