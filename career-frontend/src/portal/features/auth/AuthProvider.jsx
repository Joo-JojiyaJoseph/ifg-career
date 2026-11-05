import { createContext, useContext, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { fetchMe, logout as logoutRequest } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: ['hr', 'me'],
    queryFn: fetchMe,
    retry: false,
  })

  const value = useMemo(
    () => ({
      user: me.data ?? null,
      loading: me.isLoading,
      refresh: () => queryClient.invalidateQueries({ queryKey: ['hr', 'me'] }),
      setUser: (user) => queryClient.setQueryData(['hr', 'me'], user),
      logout: async () => {
        await logoutRequest()
        queryClient.setQueryData(['hr', 'me'], null)
      },
    }),
    [me.data, me.isLoading, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook shares the provider module
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

AuthProvider.propTypes = { children: PropTypes.node }
