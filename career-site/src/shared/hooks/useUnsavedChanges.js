import { useEffect } from 'react'

/** Warn before leaving a dirty application form. */
export function useUnsavedChanges(active) {
  useEffect(() => {
    if (!active) return undefined

    function onBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    function onClick(event) {
      const link = event.target.closest?.('a[href]')
      if (!link || link.target === '_blank') return
      if (link.origin !== window.location.origin) return
      if (!window.confirm('Leave this page?')) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [active])
}
