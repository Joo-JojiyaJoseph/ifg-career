import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@shared/api/queryClient'
import { MotionProvider } from '@shared/ui/Motion'
import { ScrollManager } from '@shared/ui/ScrollManager'
import { ToastProvider } from '@shared/ui/Toast'
import { AuthProvider } from './features/auth/AuthProvider'
import { AppRoutes } from './routes'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MotionProvider>
          <AuthProvider>
            <BrowserRouter>
              <ScrollManager />
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </MotionProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
