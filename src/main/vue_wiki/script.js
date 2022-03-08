import { gE } from "../lib/utils";

async function saveDoc(docId, content) {
  let req = await fetch("notebook", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: docId, content }),
  });
}

const pagesByName = new Map();

export default {
  mounted() {
    this.toggleDark();
    document.addEventListener("scroll", (evt) => {
      this.scrolled = window.scrollY > 36;
    });
  },
  computed: {
    titleClass() {
      return this.scrolled ? "toptitle scrolled" : "toptitle";
    },
  },
  methods: {
    imageAdded(file) {
      this.$refs.editor.replaceSelection(`![img](images/${file.name})\n`);
    },
    editorMode() {
      if (this.$refs.editor) return this.$refs.editor.editorMode;
      return false;
    },
    toggleDark() {
      const themeSelectors = ["body", "#main", "#sidebar"];
      const darkClass = "dark";
      const action = gE(themeSelectors[0]).classList.contains("dark")
        ? "remove"
        : "add";
      this.isDark = action != "add";
      themeSelectors.forEach((name) => gE(name).classList[action](darkClass));
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
      if (this.editorMode()) this.toggleEditor();
      if (this.pages.length == 1) {
        alert("You can't make the Notebook empty.");
        return;
      }
      this.$refs.modals.askUser(
        `Delete ${this.pageTitle}`,
        `<h3>Are you sure you want to delete ${this.pageTitle}?</h3>`,
        "Delete",
        {},
        async () => {
          let success = false;
          try {
            await fetch(`notebook?name=${this.pageTitle}`, {
              method: "DELETE",
            });
            success = true;
          } catch (err) {
            console.error(err);
          }
          if (success) {
            pagesByName.delete(this.pageTitle);
            this.pages.splice(this.pageIndex, 1);
            // re-adjust indices
            for (let i = this.pageIndex; i < this.pages.length; i++) {
              const name = this.pages[i].name;
              const v = pagesByName.get(name);
              pagesByName.set(name, v - 1);
            }
            if (this.pageIndex) this.pageIndex--;
            this.openPage(this.pageIndex);
          }
        }
      );
    },
    async savePage() {
      this.pages[pagesByName.get(this.pageTitle)].content =
        this.$refs.editor.markdownText;
      await saveDoc(this.pageTitle, this.$refs.editor.markdownText);
    },
    getTabClasses(name) {
      const c = ["pageTab"];
      if (this._matching.has(name)) c.push("matchSearch");
      if (this.pageTitle == name) c.push("opened");
      return c.join(" ");
    },
    async newPage() {
      this.$refs.modals.askUser(
        `Create a new note`,
        `Type the name for the new note:`,
        "Create",
        { hasInput: true },
        async (name) => {
          if (!name) return;
          const content = `# ${name}`;
          let success = false;
          try {
            await fetch("notebook", {
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
        }
      );
    },
    openPage(idx) {
      if (this.editorMode()) this.toggleEditor();
      let page = this.pages[parseInt(idx)];
      if (!page) {
        console.error(`Can't open page number ${idx}`);
        return;
      }
      this.pageTitle = page.name;
      this.$refs.editor.markdownText = page.content;
      this.pageIndex = parseInt(idx);
    },
    cancelEdit() {
      this.$refs.editor.toggleEditor({ save: false });
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
      if (this.editorMode()) this.toggleEditor();
      this.$refs.modals.askUser(
        `Find something`,
        `Type the pattern you are searching for`,
        "Search",
        { hasInput: true },
        async (pat) => {
          const lowPat = pat.toLowerCase();
          this._matching.clear();
          let firstMatch = null;
          for (let page of this.pages) {
            if (page.content.toLowerCase().indexOf(lowPat) != -1) {
              this._matching.add(page.name);
              if (firstMatch == null) firstMatch = page.name;
            }
          }
          if (firstMatch != null) {
            this.openPageByName(firstMatch);
            setTimeout(() => {
              window.getSelection().empty();
              window.find(pat);
            }, 1);
          }
        }
      );
    },
    showHelp() {
      this.$refs.modals.showHelp();
    },
  },
  data() {
    return {
      isDark: true,
      _matching: new Set(),
      scrolled: false,
      pages: [],
      sidebarHidden: false,
      pageTitle: "Wiki",
      pageIndex: -1,
    };
  },
};
