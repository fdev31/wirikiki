import { debounce } from "../lib/utils";
import { createApp } from "vue";
import wiki from "./wiki.vue";
import barbutton from "./barbutton.vue";
import modals from "./modals.vue";
import markdownEditor from "./markdown-editor.vue";

// XXX: borrowed from https://stackoverflow.com/questions/64990541/how-to-implement-debounce-in-vue3
function vueDebounce(el, binding) {
  if (binding.value !== binding.oldValue) {
    el.oninput = debounce(
      () => el.dispatchEvent(new Event("change")),
      parseInt(binding.value) || 500
    );
  }
}

export let vue = null;

const keyHandlers = {
  Escape() {
    if (vue.$refs.editor.editorMode) {
      vue.toggleEditor();
    } else {
      vue.toggleSide();
    }
  },
  f() {
    if (!vue.$refs.editor.editorMode) {
      vue.searchMode();
    }
  },
  e() {
    if (!vue.$refs.editor.editorMode) {
      vue.toggleEditor();
    }
  },
  n() {
    if (!vue.$refs.editor.editorMode) {
      vue.newPage();
    }
  },
  Delete() {
    if (!vue.$refs.editor.editorMode) {
      vue.deletePage();
    }
  },
  Backspace() {
    if (!vue.$refs.editor.editorMode) {
      vue.toggleSide();
    }
  },
  ArrowLeft() {
    if (!vue.$refs.editor.editorMode) {
      vue.switchPage(-1);
    }
  },
  ArrowRight() {
    if (!vue.$refs.editor.editorMode) {
      vue.switchPage(1);
    }
  },
};

export function openlink(text) {
  let link = decodeURIComponent(text);
  vue.openPageByName(link);
}

function initInternalLinks() {
  // converts intern refs to "openlink" calls
  markdownEditor.addPlugin("postrender", (text) =>
    text.replace(
      /<a href=":([^"]+)/g,
      (...args) => `<a href="#" onclick="app.openlink('${args[1]}')`
    )
  );
  markdownEditor.addPlugin("prerender", (text) =>
    text.replace(/(.\s*)\[\[([^\]]+)\]\]/g, (match, prefix, text) => {
      if (match[0] == "\\") {
        return `[[${prefix.slice(1)}${text}]]`;
      } else {
        return `${prefix}[${text}](:${encodeURIComponent(text)})`;
      }
    })
  );
}

export function init() {
  // register plugins
  initInternalLinks();
  // build the app
  const vu = createApp(wiki);
  vu.directive("debounce", vueDebounce);
  vu.component("bar-button", barbutton);
  vu.component("markdown-editor", markdownEditor);
  vu.component("modals", modals);
  vue = vu.mount("#app");

  fetch("/notebooks").then((req) => {
    req.json().then(vue.setContent);
  });

  // install global key handlers
  document.onkeyup = function (evt) {
    if (vue.$refs.modals.active()) return;
    const name = (evt || window.event).key;
    if (keyHandlers[name]) keyHandlers[name]();
  };
}
