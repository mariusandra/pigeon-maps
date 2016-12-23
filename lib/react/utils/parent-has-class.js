"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parentHasClass;
function parentHasClass(element, className) {
  while (element) {
    if (element.classList.contains(className)) {
      return true;
    }
    element = element.offsetParent;
  }

  return false;
}