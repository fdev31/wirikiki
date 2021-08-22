import { gE } from "../lib/utils";
import MicroModal from "micromodal";

MicroModal.init();

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
    active() {
      if (this.currentModal)
        return (
          document.getElementById(this.currentModal).attributes["aria-hidden"]
            .value == "false"
        );
    },
    runConfirmation() {
      MicroModal.close(this.currentModal);
      this._confirmation(this.hasInput ? this.userInput : undefined);
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
      MicroModal.show("modal-action");
      if (this.hasInput) {
        setTimeout(() => {
          gE("input.userInput").focus();
        });
      }
    },
    showHelp() {
      this.currentModal = "modal-help";
      MicroModal.show("modal-help");
    },
  },
};
