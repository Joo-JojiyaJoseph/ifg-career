import { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BellAlertIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { Modal } from '@shared/ui/Modal'
import { contentQuery } from '../landing/api'
import { QuickApplyContext } from './quickApplyContext'
import { QuickApplyForm } from './QuickApplySection'
import { TalentSignupForm } from './TalentSignupForm'

/**
 * Lets every "Quick Apply" button work from any page. On the home page the link scrolls to the section
 * as before; elsewhere the same two-step form opens in a dialog, so the visitor stays where they are.
 */
export function QuickApplyProvider({ children }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState(0)
  const [alerts, setAlerts] = useState(false)
  const content = useQuery({ ...contentQuery, enabled: open })

  const openQuickApply = useCallback(
    (event) => {
      if (location.pathname === '/' && document.getElementById('quick-apply')) return
      event?.preventDefault()
      setKey((current) => current + 1)
      setOpen(true)
    },
    [location.pathname],
  )
  const openJobAlerts = useCallback((event) => {
    event?.preventDefault()
    setKey((current) => current + 1)
    setAlerts(true)
  }, [])
  const value = useMemo(() => ({ openQuickApply, openJobAlerts }), [openQuickApply, openJobAlerts])

  return (
    <QuickApplyContext.Provider value={value}>
      {children}
      <Modal open={open} onClose={() => setOpen(false)} size="lg" icon={PaperAirplaneIcon} title="Quick Apply" description="No sign-in and no specific vacancy needed. Share your profile and we'll consider you for suitable roles.">
        {open ? <QuickApplyForm key={key} bare confirmation={content.data?.quick_apply_confirmation} /> : null}
      </Modal>
      <Modal open={alerts} onClose={() => setAlerts(false)} size="sm" icon={BellAlertIcon} title="Get job alerts" description="Join the Infolks Group talent community. We'll email you about new openings and company updates.">
        {alerts ? <TalentSignupForm key={key} onDone={() => setAlerts(false)} /> : null}
      </Modal>
    </QuickApplyContext.Provider>
  )
}

QuickApplyProvider.propTypes = { children: PropTypes.node }
