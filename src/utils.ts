export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>
  return function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), wait)
  }
}

export function parentHasClass(element: HTMLElement, className: string) {
  while (element) {
    if (element.classList && element.classList.contains(className)) {
      return true
    }
    element = element.parentElement
  }

  return false
}

export function parentPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return { x: rect.left, y: rect.top }
}
