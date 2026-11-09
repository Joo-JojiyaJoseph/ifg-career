import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@shared/api/queryClient'
import { MotionProvider } from '@shared/ui/Motion'
import { ScrollManager } from '@shared/ui/ScrollManager'
import { ToastProvider } from '@shared/ui/Toast'
import { AuthProvider } from './features/auth/AuthProvider'
import { AppRoutes } from './routes'

/** Job and campaign forms open as modal routes over their list; keep the list where it was. */
const modalRoute = /^\/(jobs\/(new|[^/]+\/edit)|talent\/new)$/
const keepScroll = (from, to) => modalRoute.test(from) || modalRoute.test(to)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MotionProvider>
          <AuthProvider>
            <BrowserRouter>
              <ScrollManager keepScroll={keepScroll} />
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </MotionProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
