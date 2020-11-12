export function parentHasClass(element: HTMLElement, className: string) {
  while (element) {
    if (element.classList && element.classList.contains(className)) {
      return true
    }
    element = element.parentElement
  }

  return false
}
