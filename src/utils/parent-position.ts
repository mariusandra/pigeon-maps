export function parentPosition(element: Element) {
  const rect = element.getBoundingClientRect()
  return { x: rect.left, y: rect.top }
}
