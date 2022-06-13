export const gE = (d) => document.querySelector(d);

export const E = (s) => JSON.parse(JSON.stringify(s));

export function debounce(fn, delay) {
  var t = 0;
  return (...args) => {
    clearTimeout(t);
    var that = this;
    t = setTimeout(function () {
      fn.apply(that, ...args);
    }, delay);
  };
}

export function getTokenHeader() {
  let accessToken = null;
  try {
    for (const i in document.cookie.split(";")) {
      const c = document.cookie.split(";")[i].trim();
      if (c.startsWith("accessToken=")) {
        accessToken = c.split("=")[1];
      }
    }
  } catch (e) {
    console.log("No token found");
  }
  return { Authorization: "Bearer " + accessToken };
}
