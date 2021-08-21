import hljs from "highlight.js";

import "highlight.js/styles/github.css";
import markdownittasklists from "markdown-it-task-lists";

export const md = new markdownit({
  html: true,
  breaks: false,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (err) {}
    }
    return "";
  },
});
md.use(markdownittasklists);
md.linkify.add("file:", {
  validate(text, pos, self) {
    var tail = text.slice(pos);
    console.log("TAIL", tail);
    return tail.match(/^([^)]+)\)/)[0].length - 1;
  },
  normalize(match) {
    console.log("url", match.url);
    match.url = "file:" + match.url;
  },
});
