import { md } from "../lib/markdown";

let simplemde = null;

const gE = (d) => document.querySelector(d);

const E = (s) => JSON.parse(JSON.stringify(s));

async function saveDoc(docId, content) {
  let req = await fetch("/notebook", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: docId, content }),
  });
}

const pagesByName = new Map();

export default {
  mounted() {
    this.toggleDark();
  },
  computed: {
    toggleButtonCaption() {
      return (this.sidebarHidden && ">>") || "<<";
    },
    markdownRender() {
      // Escape [[ some link ]] syntax
      let source = this.markdownText.replace(
        /\[\[([^\]]+)\]\]/g,
        (...args) => `[${args[1]}](:${encodeURIComponent(args[1])})`
      );
      source = source.replace(/=>/g, () => "⇒");
      source = source.replace(/->/g, () => "→");
      source = source.replace(/-->/g, () => "⟶");

      const r = md.render(source);
      // convert intern refs to "openlink" calls
      return r.replace(
        /<a href=":([^"]+)/g,
        (...args) => `<a href="#" onclick="app.openlink('${args[1]}')`
      );
    },
  },
  methods: {
    toggleDark() {
      if (gE("body").classList.contains("dark")) {
        gE("body").classList.remove("dark");
        gE("#main").classList.remove("dark");
        gE("#sidebar").classList.remove("dark");
      } else {
        gE("body").classList.add("dark");
        gE("#main").classList.add("dark");
        gE("#sidebar").classList.add("dark");
      }
    },
    onReturnKey(evt) {
      if (evt.ctrlKey) {
        this.toggleEditor();
      } else {
        gE("textarea").style.height = gE("textarea").scrollHeight + "px";
      }
    },
    setContent(pages) {
      this.pages = pages;
      for (let i in this.pages) {
        pagesByName.set(this.pages[i].name, i);
      }
      if (pagesByName.has("Home")) {
        this.openPageByName("Home");
      } else {
        this.openPage(0);
      }
    },
    openPageByName(name) {
      this.openPage(pagesByName.get(name));
    },
    switchPage(direction) {
      let newIdx = this.pageIndex + direction;
      if (newIdx >= 0 && newIdx < this.pages.length) {
        this.pageIndex = newIdx;
        this.openPage(newIdx);
      }
    },
    async deletePage() {
      if (this.pages.length == 1) {
        alert("You can't make the Notebook empty.");
        return;
      }
      this.$refs.modals.deleteConfirmation(this.pageTitle, async () => {
        let success = false;
        try {
          await fetch(`/notebook?name=${this.pageTitle}`, { method: "DELETE" });
          success = true;
        } catch (err) {
          console.error(err);
        }
        if (success) {
          pagesByName.delete(this.pageTitle);
          this.pages.splice(this.pageIndex, 1);
          if (this.pages.length - 1 == this.pageIndex) {
            this.pageIndex--;
          }
          this.openPage(this.pageIndex);
        }
      });
    },
    getTabClasses(name) {
      const c = ["pageTab"];
      if (this._matching.has(name)) c.push("matchSearch");
      return c.join(" ");
    },
    async newPage() {
      const name = prompt("New page name:");
      if (!name) return;
      const content = "# To be written";
      let success = false;
      try {
        await fetch("/notebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, content }),
        });
        success = true;
      } catch (err) {
        alert("Error happened");
        console.error(err);
      }
      if (success) {
        const idx = this.pages.length;
        this.pages.push({ name, content });
        pagesByName.set(name, idx);
        this.openPage(idx);
      }
    },
    openPage(idx) {
      let page = this.pages[idx];
      this.pageTitle = page.name;
      this.markdownText = page.content;
      this.pageIndex = idx;
    },
    toggleEditor() {
      this.editorMode = !this.editorMode;
      if (this.editorMode) {
        this.$originalContent = this.markdownText;
        setTimeout(() => {
          let ta = gE("textarea");
          simplemde = new SimpleMDE({ element: ta });
          simplemde.value(this.$originalContent);
        }, 1);
      } else {
        this.markdownText = simplemde.value();
        simplemde.toTextArea();
        if (this.$originalContent != this.markdownText) {
          saveDoc(this.pageTitle, this.markdownText);
        }
      }
    },
    toggleSide() {
      this.sidebarHidden = !this.sidebarHidden;
      if (this.sidebarHidden) {
        gE("#sidebar").classList.add("folded");
        gE("#main").classList.add("fullscreen");
      } else {
        gE("#sidebar").classList.remove("folded");
        gE("#main").classList.remove("fullscreen");
      }
    },
    searchMode() {
      let pat = prompt("Search for:");
      if (!pat) return;
      this._matching.clear();
      let firstMatch = null;
      for (let page of this.pages) {
        if (page.content.indexOf(pat) != -1) {
          this._matching.add(page.name);
          if (firstMatch == null) firstMatch = page.name;
        }
      }
      if (firstMatch != null) {
        this.openPageByName(firstMatch);
        setTimeout(() => window.find(pat), 1);
      }
    },
    showHelp() {
      this.$refs.modals.showHelp();
    },
  },
  data() {
    return {
      _matching: new Set(),
      pages: [],
      sidebarHidden: false,
      pageTitle: "Wiki",
      markdownText: "",
      pageIndex: -1,
      editorMode: false,
    };
  },
};
