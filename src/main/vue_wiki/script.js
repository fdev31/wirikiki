import { gE } from "../lib/utils";

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
  methods: {
    editorMode() {
      if (this.$refs.editor) return this.$refs.editor.editorMode;
      return false;
    },
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
        this.pageIndex = parseInt(newIdx);
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
    async savePage() {
      await saveDoc(this.pageTitle, this.$refs.editor.markdownText);
    },
    getTabClasses(name) {
      const c = ["pageTab"];
      if (this._matching.has(name)) c.push("matchSearch");
      if (this.pageTitle == name) c.push("opened");
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
      let page = this.pages[parseInt(idx)];
      if (!page) {
        console.error(`Can't open page number ${idx}`);
        return;
      }
      this.pageTitle = page.name;
      this.$refs.editor.markdownText = page.content;
      this.pageIndex = parseInt(idx);
    },
    toggleEditor() {
      this.$refs.editor.toggleEditor();
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
      pageIndex: -1,
    };
  },
};
