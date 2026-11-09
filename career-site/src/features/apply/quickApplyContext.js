import { createContext, useContext } from 'react'

/**
 * Opens Quick Apply (scrolls to the section on the home page, or a dialog anywhere else) and the
 * talent community sign-up dialog ("Get job alerts").
 */
export const QuickApplyContext = createContext({ openQuickApply: () => {}, openJobAlerts: () => {} })

export function useQuickApply() {
  return useContext(QuickApplyContext)
}
