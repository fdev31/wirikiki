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
      let source = plugins.prerender.reduce(
        (text, handler) => handler(text),
        this.markdownText
      );
      return plugins.postrender.reduce(
        (text, handler) => handler(text),
        md.render(source)
      );
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
