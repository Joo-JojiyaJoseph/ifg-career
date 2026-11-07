import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { PageHeader } from '@shared/ui/Card'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { Tabs } from '@shared/ui/Tabs'
import { EntitiesEditor } from './EntitiesEditor'
import { ListEditor } from './ListEditor'
import { SettingForm } from './SettingForm'
import { SocialLinksForm } from './SocialLinksForm'
import { fetchEntityContent, fetchSettings } from './api'

const careersUrl = import.meta.env.VITE_CAREERS_URL || 'http://localhost:5173'

/** One tab per section of the careers page, in the order visitors see them. */
const tabs = [
  { id: 'banner', label: '1 · Opening banner' },
  { id: 'entities', label: '2 · Our companies' },
  { id: 'about', label: '3 · A place to belong' },
  { id: 'interview', label: '4 · Interview procedure' },
  { id: 'quick-apply', label: '5 · Quick apply' },
  { id: 'faqs', label: '6 · FAQs' },
  { id: 'footer', label: '7 · Footer' },
]

export function ContentPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'banner'
  const settings = useQuery({ queryKey: ['hr-content', 'settings'], queryFn: fetchSettings })
  const entities = useQuery({ queryKey: ['hr-content', 'entities'], queryFn: fetchEntityContent })

  const values = settings.data ?? {}

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Website Content"
        subtitle="Every section of the careers page, in the order visitors see it. Changes go live straight away."
        actions={
          <a href={careersUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-600 bg-white px-5 text-sm font-medium text-brand-700 hover:bg-brand-50">
            View careers site <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
          </a>
        }
      />
      <Tabs items={tabs} value={tab} onChange={(next) => setParams(next === 'banner' ? {} : { tab: next }, { replace: true })} label="Landing page sections" />
      {settings.isLoading ? <Skeleton className="h-64" /> : null}
      {settings.isError ? <ErrorState onRetry={() => settings.refetch()} /> : null}
      {settings.data ? (
        <div className="flex flex-col gap-6">
          {tab === 'banner' ? (
            <>
              <SettingForm settingKey="hero" value={values.hero} />
              <SettingForm settingKey="company_numbers" value={values.company_numbers} />
              <SettingForm settingKey="promo_card" value={values.promo_card} />
            </>
          ) : null}
          {tab === 'entities' ? (
            <>
              <SettingForm settingKey="entities_section" value={values.entities_section} />
              {entities.isLoading ? <Skeleton className="h-64" /> : null}
              {entities.isError ? <ErrorState onRetry={() => entities.refetch()} /> : null}
              {entities.data ? <EntitiesEditor entities={entities.data} /> : null}
            </>
          ) : null}
          {tab === 'about' ? (
            <>
              <SettingForm settingKey="about_intro" value={values.about_intro} />
              <ListEditor type="about-blocks" />
              <ListEditor type="media-items" />
            </>
          ) : null}
          {tab === 'interview' ? (
            <>
              <SettingForm settingKey="interview_section" value={values.interview_section} />
              <ListEditor type="interview-steps" />
            </>
          ) : null}
          {tab === 'quick-apply' ? (
            <>
              <SettingForm settingKey="quick_apply_section" value={values.quick_apply_section} />
              <SettingForm settingKey="quick_apply_confirmation_text" value={values.quick_apply_confirmation_text} />
            </>
          ) : null}
          {tab === 'faqs' ? (
            <>
              <SettingForm settingKey="faq_section" value={values.faq_section} />
              <ListEditor type="faqs" />
            </>
          ) : null}
          {tab === 'footer' ? (
            <>
              <SettingForm settingKey="footer" value={values.footer} />
              <SocialLinksForm links={values.social_links?.links ?? []} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
