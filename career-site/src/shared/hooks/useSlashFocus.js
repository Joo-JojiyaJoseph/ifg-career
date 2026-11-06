import { useEffect } from 'react'

/** Pressing / focuses the search field when the user is not already typing. */
export function useSlashFocus(ref) {
  useEffect(() => {
    function onKey(event) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const active = document.activeElement
      const tag = active?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active?.isContentEditable) return
      event.preventDefault()
      ref.current?.focus()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ref])
}
