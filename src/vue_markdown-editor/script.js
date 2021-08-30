import { md } from "./lib/markdown";
import { gE } from "./lib/utils";

let simplemde = null;

const baseToolbar = [
  "bold",
  "italic",
  "strikethrough",
  "heading",
  "heading-smaller",
  "heading-bigger",
  "heading-1",
  "heading-2",
  "heading-3",
  "code",
  "quote",
  "unordered-list",
  "ordered-list",
  "clean-block",
  "link",
  "image",
  {
    name: "newImage",
    action: insertNewImage,
    className: "fa fa-upload",
    title: "Upload image",
  },
  "table",
  "horizontal-rule",
  "preview",
  "side-by-side",
  "fullscreen",
  "|",
  "guide",
  "|",
  "undo",
  "redo",
];

const plugins = {
  prerender: [
    (text) => text.replace(/=>/g, () => "⇒"),
    (text) => text.replace(/-->/g, () => "⟶"),
  ],
  postrender: [],
};

function insertNewImage(editor) {
  app.vue.$refs.modals.showUploadForm();
}

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
    replaceSelection(text) {
      return simplemde.codemirror.replaceSelection(text);
    },
    toggleEditor(options) {
      const opts = { save: true, ...options };
      this.editorMode = !this.editorMode;
      if (this.editorMode) {
        this.$originalContent = this.markdownText;
        setTimeout(() => {
          let ta = gE("textarea");
          ta.focus();
          simplemde = new SimpleMDE({
            element: ta,
            autofocus: true,
            toolbar: baseToolbar,
          });
          simplemde.value(this.$originalContent);
        }, 1);
      } else {
        this.markdownText = simplemde.value();
        simplemde.toTextArea();
        if (opts.save) {
          if (this.$originalContent != this.markdownText) {
            this.$emit("docChanged");
          }
        } else {
          this.markdownText = this.$originalContent;
        }
      }
    },
  },
};
