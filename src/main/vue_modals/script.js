import { gE } from "../lib/utils";
import MicroModal from "micromodal";

MicroModal.init();

const getOptions = (obj) => {
  {
    onClose: obj.onClose;
  }
};

export default {
  data() {
    return {
      itemName: "",
      title: "",
      actionName: "",
      content: "",
      hasInput: false,
      userInput: "XXX",
      currentModal: false,
    };
  },
  methods: {
    onClose() {
      setTimeout(() => {
        this.currentModal = false;
      }, 200);
    },
    active() {
      return !!this.currentModal;
    },
    runConfirmation() {
      MicroModal.close(this.currentModal);
      this._confirmation(this.hasInput ? this.userInput : undefined);
    },
    hide() {
      if (this.currentModal) MicroModal.close(this.currentModal);
    },
    askUser(title, content, actionName, options, confirmAction) {
      this.currentModal = "modal-action";
      this._confirmation = confirmAction;
      this.title = title;
      this.content = content;
      this.actionName = actionName;
      let opts = options || {};
      this.hasInput = opts.hasInput;
      this.userInput = "";
      MicroModal.show("modal-action", getOptions(this));
      if (this.hasInput) {
        setTimeout(() => {
          gE("input.userInput").focus();
        });
      }
    },
    showHelp() {
      this.currentModal = "modal-help";
      MicroModal.show("modal-help", getOptions(this));
    },
  },
};
