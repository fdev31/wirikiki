import { md } from "./lib/markdown";
import { gE } from "./lib/utils";

let simplemde = null;

const baseToolbar = [
  { name: "bold", className: "fa fa-bold", title: "Bold" },
  { name: "italic", className: "fa fa-italic", title: "Italic" },
  {
    name: "strikethrough",
    className: "fa fa-strikethrough",
    title: "Strikethrough",
  },
  {
    name: "heading",
    className: "fa fa-header",
    title: "Heading",
  },
  {
    name: "heading-smaller",
    className: "fa fa-header fa-header-x fa-header-smaller",
    title: "Smaller Heading",
  },
  {
    name: "heading-bigger",
    className: "fa fa-header fa-header-x fa-header-bigger",
    title: "Bigger Heading",
  },
  {
    name: "heading-1",
    className: "fa fa-header fa-header-x fa-header-1",
    title: "Big Heading",
  },
  {
    name: "heading-2",
    className: "fa fa-header fa-header-x fa-header-2",
    title: "Medium Heading",
  },
  {
    name: "heading-3",
    className: "fa fa-header fa-header-x fa-header-3",
    title: "Small Heading",
  },
  "|",
  { name: "code", className: "fa fa-code", title: "Code" },
  {
    name: "quote",
    className: "fa fa-quote-left",
    title: "Quote",
  },
  {
    name: "unordered-list",
    className: "fa fa-list-ul",
    title: "Generic List",
    default: true,
  },
  {
    name: "ordered-list",
    className: "fa fa-list-ol",
    title: "Numbered List",
  },
  {
    name: "clean-block",
    className: "fa fa-eraser fa-clean-block",
    title: "Clean block",
  },
  "|",
  {
    name: "link",
    className: "fa fa-link",
    title: "Create Link",
  },
  {
    name: "image",
    className: "fa fa-picture-o",
    title: "Insert Image",
  },
  {
    name: "newImage",
    action: insertNewImage,
    className: "fa fa-upload",
    title: "Upload image",
  },
  { name: "table", className: "fa fa-table", title: "Insert Table" },
  {
    name: "horizontal-rule",
    className: "fa fa-minus",
    title: "Insert Horizontal Line",
  },
  "|",
  {
    name: "preview",
    className: "fa fa-eye no-disable",
    title: "Toggle Preview",
  },
  {
    name: "side-by-side",
    className: "fa fa-columns no-disable no-mobile",
    title: "Toggle Side by Side",
  },
  {
    name: "fullscreen",
    className: "fa fa-arrows-alt no-disable no-mobile",
    title: "Toggle Fullscreen",
  },
  "|",
  {
    name: "guide",
    action: "https://simplemde.com/markdown-guide",
    className: "fa fa-question-circle",
    title: "Markdown Guide",
  },
  "|",
  { name: "undo", className: "fa fa-undo no-disable", title: "Undo" },
  { name: "redo", className: "fa fa-repeat no-disable", title: "Redo" },
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
