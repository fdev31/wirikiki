export function debounce (fn, delay) {
    var t = 0;
    return (...args) => {
        clearTimeout(t);
        var that = this;
        t = setTimeout(function () {
            fn.apply(that, ...args)
        }, delay)
    }
}
