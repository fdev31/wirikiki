export default {
  mounted() {
    this.caption = this.$attrs.caption;
  },
  data() {
    return {
      caption: "Some text",
      link: "google.com",
    };
  },
};
