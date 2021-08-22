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
