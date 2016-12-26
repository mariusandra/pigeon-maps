"use strict";

exports.__esModule = true;
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