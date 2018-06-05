export default function parentPosition (element) {
  var x = -window.scrollX
  var y = -window.scrollY
  var first = true

  while (element) {
    x += (element.offsetLeft - (first ? 0 : element.scrollLeft) + element.clientLeft)
    y += (element.offsetTop - (first ? 0 : element.scrollTop) + element.clientTop)
    element = element.offsetParent
    first = false
  }

  return { x, y }
}
