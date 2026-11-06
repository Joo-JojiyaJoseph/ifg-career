import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { QuickApplySection } from '../features/apply/QuickApplySection'
import { AboutSection } from '../features/landing/AboutSection'
import { EntitiesSection } from '../features/landing/EntitiesSection'
import { FaqSection } from '../features/landing/FaqSection'
import { HeroSection } from '../features/landing/HeroSection'
import { InterviewSection } from '../features/landing/InterviewSection'
import { LifeSection } from '../features/landing/LifeSection'
import { RecognitionsSection } from '../features/landing/RecognitionsSection'
import { contentQuery } from '../features/landing/api'

const authErrors = {
  google_not_configured: 'Google sign-in is not configured yet. Add the Google client id and secret to the API.',
  google_failed: 'Google sign-in did not complete. Please try again.',
}

/**
 * The careers landing page: the nine sections of the Landing Page Guide, in order.
 * The navigation bar (1) and footer (9) come from PublicLayout.
 */
export function HomePage() {
  const [params] = useSearchParams()
  const toast = useToast()
  const content = useQuery(contentQuery)
  const message = authErrors[params.get('auth_error')] ?? null

  useEffect(() => {
    if (message) toast.push({ tone: 'warning', message })
  }, [message, toast])

  useEffect(() => {
    document.title = 'Careers at Infolks Group | Infolks, Webfolks, Dataways, Medrays'
  }, [])

  if (content.isError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <ErrorState title="The careers page could not load" description="Check your connection and try again." onRetry={() => content.refetch()} />
      </div>
    )
  }

  if (content.isLoading) {
    return (
      <div aria-busy="true">
        <div className="h-[32rem] bg-ink" />
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-64" />)}
        </div>
      </div>
    )
  }

  const data = content.data

  return (
    <>
      <HeroSection hero={data.hero} numbers={data.company_numbers} entities={data.entities ?? []} interviewSteps={data.interview_steps?.length ?? 0} />
      <EntitiesSection entities={data.entities ?? []} />
      <AboutSection about={data.about} />
      <InterviewSection steps={data.interview_steps} />
      <LifeSection stories={data.stories} drives={data.drives} media={data.media} />
      <QuickApplySection />
      <FaqSection faqs={data.faqs} />
      <RecognitionsSection items={data.recognitions} />
    </>
  )
}
