import { debounce } from "../lib/utils";
import { createApp } from "vue";
import wiki from "./wiki.vue";
import barbutton from "./barbutton.vue";
import modals from "./modals.vue";

// XXX: borrowed from https://stackoverflow.com/questions/64990541/how-to-implement-debounce-in-vue3
function vueDebounce(el, binding) {
  if (binding.value !== binding.oldValue) {
    el.oninput = debounce(
      () => el.dispatchEvent(new Event("change")),
      parseInt(binding.value) || 500
    );
  }
}

export function openlink(text) {
  let link = decodeURIComponent(text);
  vue.openPageByName(link);
}

export let vue = null;

const keyHandlers = {
  Escape() {
    if (vue.editorMode) {
      vue.toggleEditor();
    } else {
      vue.toggleSide();
    }
  },
  f() {
    if (!vue.editorMode) {
      vue.searchMode();
    }
  },
  e() {
    if (!vue.editorMode) {
      vue.toggleEditor();
    }
  },
  Delete() {
    if (!vue.editorMode) {
      vue.deletePage();
    }
  },
  Backspace() {
    if (!vue.editorMode) {
      vue.toggleSide();
    }
  },
  ArrowLeft() {
    if (!vue.editorMode) {
      vue.switchPage(-1);
    }
  },
  ArrowRight() {
    if (!vue.editorMode) {
      vue.switchPage(1);
    }
  },
};

export function init() {
  const vu = createApp(wiki);
  vu.directive("debounce", vueDebounce);
  vu.component("bar-button", barbutton);
  vu.component("modals", modals);
  vue = vu.mount("#app");
  fetch("/notebooks").then((req) => {
    req.json().then(vue.setContent);
  });

  // install global key handlers
  document.onkeyup = function (evt) {
    const name = (evt || window.event).key;
    if (keyHandlers[name]) keyHandlers[name]();
  };
}
