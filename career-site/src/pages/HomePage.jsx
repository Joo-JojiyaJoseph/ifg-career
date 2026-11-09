import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { QuickApplySection } from '../features/apply/QuickApplySection'
import { BelongSection } from '../features/landing/BelongSection'
import { EntitiesSection } from '../features/landing/EntitiesSection'
import { FaqSection } from '../features/landing/FaqSection'
import { HeroSection } from '../features/landing/HeroSection'
import { InterviewSection } from '../features/landing/InterviewSection'
import { LifeSection } from '../features/landing/LifeSection'
import { RecognitionsSection } from '../features/landing/RecognitionsSection'
import { contentQuery, culturePhotos } from '../features/landing/api'

const authErrors = {
  google_not_configured: 'Google sign-in is not configured yet. Add the Google client id and secret to the API.',
  google_failed: 'Google sign-in did not complete. Please try again.',
}

/**
 * The careers landing page, following the Infolks Group career page document:
 * 1 hero, 2 our companies, 3 a place to belong, 4 interview procedure, 5 quick apply, 6 FAQs.
 * The navigation bar and the footer (7) come from PublicLayout.
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
        <div className="-mt-16 h-[88svh] bg-ink" />
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-64" />)}
        </div>
      </div>
    )
  }

  const data = content.data
  const photos = culturePhotos(data)
  const sections = data.sections ?? {}

  return (
    <>
      <HeroSection hero={data.hero} entities={data.entities ?? []} numbers={data.company_numbers} />
      <EntitiesSection entities={data.entities ?? []} section={sections.entities} numbers={data.company_numbers} />
      <BelongSection about={data.about} />
      <InterviewSection steps={data.interview_steps} section={sections.interview} />
      <LifeSection stories={data.stories ?? []} drives={data.drives ?? []} photos={photos} videos={(data.media ?? []).filter((item) => item.youtube_id)} />
      <QuickApplySection section={sections.quick_apply} confirmation={data.quick_apply_confirmation} />
      <FaqSection faqs={data.faqs} section={sections.faq} />
      <RecognitionsSection recognitions={data.recognitions ?? []} />
    </>
  )
}
