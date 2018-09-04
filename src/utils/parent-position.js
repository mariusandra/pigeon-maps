export default function parentPosition (element) {
  const rect = element.getBoundingClientRect()
  return { x: rect.left, y: rect.top }
}
