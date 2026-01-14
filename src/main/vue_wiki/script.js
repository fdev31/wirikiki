import { gE, getTokenHeader } from "../lib/utils";

async function saveDoc(docId, content) {
  let req = await fetch("notebook", {
    method: "PUT",
    headers: Object.assign(
      { "Content-Type": "application/json" },
      getTokenHeader()
    ),
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
    logout() {
      document.cookie = "accessToken=";
      document.location.href = document.location.href;
    },
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
      this.pages = Array.from(pages.values()).sort((a, b) => {
        const nA = a.name.endsWith("/index")
          ? a.name.replace(/\/index$/, "")
          : a.name;
        const nB = b.name.endsWith("/index")
          ? b.name.replace(/\/index$/, "")
          : b.name;
        return nA.toLowerCase().localeCompare(nB.toLowerCase());
      });
      for (let i in this.pages) {
        pagesByName.set(this.pages[i].name, i);
      }
      if (pagesByName.has("Home")) {
        this.openPageByName("Home");
      } else {
        this.openPage(0);
      }
    },
    isFolder(name) {
      return name.endsWith("/index");
    },
    getDisplayName(name) {
      if (name.endsWith("/index")) {
        const parts = name.split("/");
        return parts.length > 1
          ? parts[parts.length - 2]
          : name.replace("/index", "");
      }
      return name.split("/").pop();
    },
    getIndent(name) {
      let depth = (name.match(/\//g) || []).length;
      if (name.endsWith("/index")) depth--;
      return { paddingLeft: depth * 15 + 5 + "px" };
    },
    contextMenu(evt, pageName) {
      // Prevent default browser context menu if we were implementing a custom one
      // But the user asked for buttons.
      // For now, let's keep it simple.
      // But we need a way to pass the folder context to the "add" buttons.
    },
    getPageParent(name) {
      if (name.endsWith("/index")) {
        name = name.replace(/\/index$/, "");
      }
      // If it's a folder (e.g. "foo"), we want "foo" as parent for new items
      return name;
    },

    toggleFolder(name) {
      // name is something like "foo/index"
      const folder = name.replace(/\/index$/, "");
      if (this.collapsedFolders.has(folder)) {
        this.collapsedFolders.delete(folder);
      } else {
        this.collapsedFolders.add(folder);
      }
      // Force update if needed, but Set reactivity usually requires creating new Set or using Vue.set concepts if Vue 2.
      // Vue 3 supports Set reactivity? This project says Vue 3.
      // But just to be safe, let's re-assign.
      this.collapsedFolders = new Set(this.collapsedFolders);
    },
    isCollapsed(name) {
      const folder = name.replace(/\/index$/, "");
      return this.collapsedFolders.has(folder);
    },
    isPageVisible(name) {
      let checkPath = name;
      if (checkPath.endsWith("/index")) {
        checkPath = checkPath.replace(/\/index$/, "");
        const lastSlash = checkPath.lastIndexOf("/");
        if (lastSlash === -1) return true;
        checkPath = checkPath.substring(0, lastSlash);
      } else {
        const lastSlash = checkPath.lastIndexOf("/");
        if (lastSlash === -1) return true;
        checkPath = checkPath.substring(0, lastSlash);
      }

      // Check all ancestors
      if (!checkPath) return true;

      const parts = checkPath.split("/");
      let current = "";
      for (const p of parts) {
        current += (current ? "/" : "") + p;
        if (this.collapsedFolders.has(current)) return false;
      }
      return true;
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
              headers: getTokenHeader(),
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
      const separators = Array.from(name.matchAll(RegExp("/", "g"))).length;
      if (separators > 1) c.push("collapsible");
      if (this._matching.has(name)) c.push("matchSearch");
      if (this.pageTitle == name) c.push("opened");
      return c.join(" ");
    },
    async newFolder(parent = "") {
      this.$refs.modals.askUser(
        `Create a new folder`,
        `Type the name for the new folder:`,
        "Create",
        { hasInput: true },
        async (name) => {
          if (!name) return;
          // Clean the name of illegal chars
          name = name.replace(/[^a-zA-Z0-9 _-]/g, "");

          let fullName = parent ? `${parent}/${name}` : name;
          let success = false;
          const content = `# Index of ${fullName}`;
          try {
            let req = await fetch("notebook", {
              method: "POST",
              headers: Object.assign(
                { "Content-Type": "application/json" },
                getTokenHeader()
              ),
              body: JSON.stringify({ name: `${fullName}/index`, content }),
            });
            success = 200 == req.status;
            // The backend returns the name it used, let's respect it
            const res = await req.json();
            if (res.name) {
              // If backend returns "folder/index", we just want the folder part usually
              // but let's see how our frontend handles it.
              // Our frontend stores entries as they come.
              // We constructed `${fullName}/index` above.
              fullName = res.name.replace(/\/index$/, "");
            }
          } catch (err) {
            console.error(err);
          }
          if (success) {
            const idx = this.pages.length;
            // Add the index file for the new folder
            const indexName = `${fullName}/index`;
            this.pages.push({ name: indexName, content });

            // Re-sort and re-index
            this.pages.sort((a, b) => {
              const nA = a.name.endsWith("/index")
                ? a.name.replace(/\/index$/, "")
                : a.name;
              const nB = b.name.endsWith("/index")
                ? b.name.replace(/\/index$/, "")
                : b.name;
              return nA.toLowerCase().localeCompare(nB.toLowerCase());
            });

            for (let i in this.pages) {
              pagesByName.set(this.pages[i].name, i);
            }

            this.collapsedFolders.delete(fullName);
            this.collapsedFolders = new Set(this.collapsedFolders); // trigger reactivity

            this.openPageByName(indexName);
          } else {
            alert("Error happened");
          }
        }
      );
    },
    async newPage(parent = "") {
      this.$refs.modals.askUser(
        `Create a new note`,
        `Type the name for the new note:`,
        "Create",
        { hasInput: true },
        async (name) => {
          if (!name) return;
          // Clean the name
          name = name.replace(/[^a-zA-Z0-9 _-]/g, "");

          let fullName = parent ? `${parent}/${name}` : name;
          const content = `# ${fullName}`;
          let success = false;
          try {
            let req = await fetch("notebook", {
              method: "POST",
              headers: Object.assign(
                { "Content-Type": "application/json" },
                getTokenHeader()
              ),
              body: JSON.stringify({ name: fullName, content }),
            });
            success = 200 == req.status;
            const res = await req.json();
            if (res.name) fullName = res.name;
          } catch (err) {
            console.error(err);
          }
          if (success) {
            const idx = this.pages.length;
            this.pages.push({ name: fullName, content });
            // Re-sort and re-index
            this.pages.sort((a, b) => {
              const nA = a.name.endsWith("/index")
                ? a.name.replace(/\/index$/, "")
                : a.name;
              const nB = b.name.endsWith("/index")
                ? b.name.replace(/\/index$/, "")
                : b.name;
              return nA.toLowerCase().localeCompare(nB.toLowerCase());
            });
            for (let i in this.pages) {
              pagesByName.set(this.pages[i].name, i);
            }
            this.openPageByName(fullName);
          } else {
            alert("Error happened");
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
          const matchFunc = (text) => text.toLowerCase().indexOf(lowPat) != -1;
          this._matching.clear();
          let firstMatch = null;
          for (let page of this.pages) {
            if (matchFunc(page.content) || matchFunc(page.name)) {
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
      collapsedFolders: new Set(),
    };
  },
};
