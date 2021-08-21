export default {
  mounted() {
    this.caption = this.$attrs.caption;
  },
  /*
    watch: {
        caption(oldVal, newVal) {
            this.$refs.butlink.attributes['data-caption'] =  newVal;
        }
    },
    */
  data() {
    return {
      caption: "Some text",
      link: "google.com",
    };
  },
};
