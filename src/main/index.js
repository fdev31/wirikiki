import { debounce, getTokenHeader } from "../lib/utils";
import { createApp } from "vue";
import wiki from "./wiki.vue";
import barbutton from "../barbutton.vue";
import modals from "../modals.vue";
import markdownEditor from "../markdown-editor.vue";

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
      setTimeout(initCalendar, 10);
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

function resetState() {
  scheduler.clearAll();
  schedules.length = 0;
}

let dates = [];
let schedules = [];

function initCalendar() {
  resetState();
  scheduler.config.readonly = true;
  scheduler.config.include_end_by = true;
  scheduler.config.first_hour = 5;
  scheduler.config.last_hour = 23;
  scheduler.init("scheduler_here", new Date(), "week");
  const eu_re = /^\s*(\d+)[/](\d+)[/](\d+)\s+(\d+):(\d+)-(\d+):(\d+)\s(.*)/;
  const eu_recurring_re =
    /@([a-z]+)\s+(\d+)[/](\d+)[/](\d+)\s+(\d+):(\d+)-(\d+):(\d+)\s(.*)/;
  for (const i in dates) {
    const date = dates[i];
    let splitInfo = date.match(eu_re);
    if (splitInfo) {
      const [_, day, month, year, s_hour, s_min, e_hour, e_min, descr] =
        splitInfo;
      schedules.push({
        id: i,
        start_date: `${year}-${month}-${day} ${s_hour}:${s_min}`,
        end_date: `${year}-${month}-${day} ${e_hour}:${e_min}`,
        text: descr,
      });
      continue;
    }
    splitInfo = date.match(eu_recurring_re);
    if (splitInfo) {
      const [_, mode, day, month, year, s_hour, s_min, e_hour, e_min, descr] =
        splitInfo;
      const o = {
        id: i,
        start_date: `${year}-${month}-${day} ${s_hour}:${s_min}`,
        end_date: `9999-${month}-${day} ${e_hour}:${e_min}`,
        event_pid: 0,
        text: descr,
      };
      if (mode === "weekly") {
        o.rec_type = "week_1___4#no";
        o.rec_pattern = "week_1___4";
        o.event_length = 36000;
      } else if (mode === "yearly") {
        o.rec_type = "year_1___#no";
        o.rec_pattern = "year_1___1";
        o.event_length = 36000;
      }
      schedules.push(o);
      continue;
    }
  }
  scheduler.parse(schedules);
}

function initInternalLinks() {
  // converts intern refs to "openlink" calls
  markdownEditor.addPlugin("postrender", (text) => {
    setTimeout(initCalendar, 10);
    return text.replace(
      /<a href=":([^"]+)/g,
      (...args) => `<a href="#" onclick="app.openlink('${args[1]}')`
    );
  });
  markdownEditor.addPlugin("prerender", (text) =>
    text.replace(/(.\s*)\[\[([^\]]+)\]\]/g, (match, prefix, text) => {
      if (match[0] == "\\") {
        return `[[${prefix.slice(1)}${text}]]`;
      } else {
        return `${prefix}[${text}](:${encodeURIComponent(text)})`;
      }
    })
  );
  // convert calendar markup to html / js
  markdownEditor.addPlugin("prerender", (text) =>
    text.replace(/#calendar[\s\S]*?^\)/gm, (match, prefix, text) => {
      dates = match.split("\n").slice(1, -1);
      return `<div id="scheduler_here" class="dhx_cal_container" style="width:100%; height:100vh;" onclick="event.stopPropagation()">
	<div class="dhx_cal_navline">
		<div class="dhx_cal_prev_button">&nbsp;</div>
		<div class="dhx_cal_next_button">&nbsp;</div>
		<div class="dhx_cal_today_button"></div>
		<div class="dhx_cal_date"></div>
		<div class="dhx_cal_tab" name="day_tab"></div>
		<div class="dhx_cal_tab" name="week_tab"></div>
		<div class="dhx_cal_tab" name="month_tab"></div>
	</div>
	<div class="dhx_cal_header"></div>
	<div class="dhx_cal_data"></div>
</div>`;
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

  fetch("notebooks", { headers: getTokenHeader() }).then((req) => {
    if (req.status == 401) {
      let p = new URLSearchParams();
      p.set("username", prompt("User name"));
      p.set("password", prompt("Password"));
      // get the token
      fetch("/token", {
        method: "POST",
        body: p,
      }).then((req) => {
        req.json().then((data) => {
          document.cookie = "accessToken=" + data.access_token;
          document.location.href = document.location.href;
        });
      });
    } else {
      req.json().then(vue.setContent);
    }
  });

  const globalTags = ["BODY", "TEXTAREA"];
  // install global key handlers
  document.onkeyup = function (evt) {
    if (globalTags.indexOf(evt.target.tagName) == -1) return;
    if (vue.$refs.modals.active()) return;
    const name = (evt || window.event).key;
    if (keyHandlers[name]) keyHandlers[name]();
  };
}
