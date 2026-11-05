import { createContext, useContext, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { fetchMe, logout as logoutRequest } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const me = useQuery({ queryKey: ['candidate', 'me'], queryFn: fetchMe, retry: false })

  const value = useMemo(
    () => ({
      candidate: me.data ?? null,
      loading: me.isLoading,
      logout: async () => {
        await logoutRequest()
        queryClient.setQueryData(['candidate', 'me'], null)
      },
    }),
    [me.data, me.isLoading, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook shares the provider module
export function useCandidateAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useCandidateAuth must be used within AuthProvider')
  return context
}

AuthProvider.propTypes = { children: PropTypes.node }
