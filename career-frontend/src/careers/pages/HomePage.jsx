import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@shared/ui/Button'
import { useToast } from '@shared/ui/Toast'
import { QuickApplySection } from '../features/apply/QuickApplySection'
import { startGoogleSignIn } from '../features/auth/api'

const errors = {
  google_not_configured: 'Google sign-in is not configured yet. Add the Google client id and secret to the API.',
  google_failed: 'Google sign-in did not complete. Please try again.',
}

export function HomePage() {
  const [params] = useSearchParams()
  const toast = useToast()
  const message = errors[params.get('auth_error')] ?? null

  useEffect(() => {
    if (message) {
      toast.push({ tone: 'warning', message })
    }
  }, [message, toast])

  return (
    <>
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20">
        <p className="text-sm uppercase tracking-wide text-white/70">Infolks Group</p>
        <h1 className="max-w-xl font-display text-4xl font-semibold sm:text-5xl">Grow your career with Infolks Group</h1>
        <p className="max-w-xl text-white/80">Roles at Infolks, Webfolks, Dataways and Medrays. The full landing page is built in a later phase.</p>
        {message ? (
          <p className="max-w-xl rounded-xl bg-white/15 px-4 py-3 text-sm" role="alert">
            {message}
          </p>
        ) : null}
        <div>
          <Button variant="orange" onClick={startGoogleSignIn}>
            Sign in with Google
          </Button>
        </div>
      </div>
    </section>
    <QuickApplySection />
    </>
  )
}
