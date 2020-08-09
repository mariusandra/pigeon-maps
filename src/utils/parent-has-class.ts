export function parentHasClass(element: HTMLElement, className: string) {
  while (element) {
    if (element.classList && element.classList.contains(className)) {
      return true
    }
    element = element.offsetParent as HTMLElement // TODO remove cast to `HTMLElement`
  }

  return false
}
