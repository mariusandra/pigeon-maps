"use strict";

exports.__esModule = true;
exports.default = parentPosition;
function parentPosition(element) {
  var x = 0;
  var y = 0;
  var first = true;

  while (element) {
    x += element.offsetLeft - (first ? 0 : element.scrollLeft) + element.clientLeft;
    y += element.offsetTop - (first ? 0 : element.scrollTop) + element.clientTop;
    element = element.offsetParent;
    first = false;
  }

  return { x: x, y: y };
}