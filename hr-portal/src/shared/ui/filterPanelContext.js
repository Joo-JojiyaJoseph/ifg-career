import { createContext, useContext } from 'react'

export const FilterPanelContext = createContext(false)

/** True inside a FilterPanel, so filter grids switch to one column. */
export function useInFilterPanel() {
  return useContext(FilterPanelContext)
}
