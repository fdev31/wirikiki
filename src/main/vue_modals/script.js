import MicroModal from "micromodal";

MicroModal.init();

export default {
  data() {
    return {
      itemName: "",
    };
  },
  methods: {
    runConfirmation() {
      this._confirmation();
    },
    showHelp() {
      MicroModal.show("modal-help");
    },
    deleteConfirmation(name, confirmAction) {
      this._confirmation = confirmAction;
      this.itemName = name;
      MicroModal.show("modal-delete");
    },
  },
};
