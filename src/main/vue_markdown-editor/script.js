import { md } from "../lib/markdown";
import { gE } from "../lib/utils";

let simplemde = null;

const plugins = {
  prerender: [
    (text) => text.replace(/=>/g, () => "⇒"),
    (text) => text.replace(/-->/g, () => "⟶"),
  ],
  postrender: [],
};

export default {
  addPlugin(plugType, handler) {
    plugins[plugType].push(handler);
  },
  emits: ["docChanged"],
  data() {
    return {
      markdownText: "",
      editorMode: false,
    };
  },
  computed: {
    markdownRender() {
      // Escape [[ some link ]] syntax
      let source = this.markdownText.replace(
        /([^`])\[\[([^\]]+)\]\]/g,
        (...args) => `${args[1]}[${args[2]}](:${encodeURIComponent(args[1])})`
      );
      for (const plug of plugins.prerender) {
        source = plug(source);
      }

      let render = md.render(source);
      for (const plug of plugins.postrender) {
        render = plug(render);
      }
      return render;
    },
  },
  methods: {
    toggleEditor() {
      this.editorMode = !this.editorMode;
      if (this.editorMode) {
        this.$originalContent = this.markdownText;
        setTimeout(() => {
          let ta = gE("textarea");
          ta.focus();
          simplemde = new SimpleMDE({ element: ta });
          simplemde.value(this.$originalContent);
        }, 1);
      } else {
        this.markdownText = simplemde.value();
        simplemde.toTextArea();
        if (this.$originalContent != this.markdownText) {
          this.$emit("docChanged");
        }
      }
    },
  },
};
