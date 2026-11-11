import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

/**
 * Guards a form with unsaved changes. Clicking a link inside the app opens a "Leave this page?" dialog instead of
 * leaving; closing or reloading the tab still gets the browser's own warning (browsers do not allow a custom one).
 * Returns the dialog: render it once in the page, e.g. `const leaveDialog = useUnsavedChanges(dirty)` … `{leaveDialog}`.
 */
export function useUnsavedChanges(active) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(null)

  useEffect(() => {
    if (!active) return undefined

    function onBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    function onClick(event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target.closest?.('a[href]')
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      if (link.origin !== window.location.origin) return
      const to = `${link.pathname}${link.search}${link.hash}`
      if (to === `${window.location.pathname}${window.location.search}${window.location.hash}`) return
      event.preventDefault()
      event.stopPropagation()
      setPending(to)
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [active])

  function leave() {
    const to = pending
    setPending(null)
    navigate(to)
  }

  return (
    <Modal
      open={Boolean(pending) && active}
      onClose={() => setPending(null)}
      title="Leave this page?"
      icon={ExclamationTriangleIcon}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => setPending(null)}>Stay on this page</Button>
          <Button variant="danger" onClick={leave}>Leave page</Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">You have changes that are not saved yet. If you leave now, they will be lost.</p>
    </Modal>
  )
}
