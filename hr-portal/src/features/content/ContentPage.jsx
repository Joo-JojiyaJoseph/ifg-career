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

const tabs = [
  { id: 'banner', label: 'Banner & numbers' },
  { id: 'entities', label: 'Our entities' },
  { id: 'about', label: 'About the group' },
  { id: 'interview', label: 'Interview process' },
  { id: 'life', label: 'Life at the group' },
  { id: 'quick-apply', label: 'Quick apply' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'footer', label: 'Recognitions & footer' },
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
        subtitle="Everything on the careers landing page. Changes go live straight away."
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
          {tab === 'entities' ? (entities.isLoading ? <Skeleton className="h-64" /> : <EntitiesEditor entities={entities.data ?? []} />) : null}
          {tab === 'about' ? (
            <>
              <SettingForm settingKey="about_intro" value={values.about_intro} />
              <ListEditor type="about-blocks" />
            </>
          ) : null}
          {tab === 'interview' ? <ListEditor type="interview-steps" /> : null}
          {tab === 'life' ? (
            <>
              <ListEditor type="employee-stories" entities={entities.data ?? []} />
              <ListEditor type="recruitment-drives" />
              <ListEditor type="media-items" />
            </>
          ) : null}
          {tab === 'quick-apply' ? <SettingForm settingKey="quick_apply_confirmation_text" value={values.quick_apply_confirmation_text} /> : null}
          {tab === 'faqs' ? <ListEditor type="faqs" /> : null}
          {tab === 'footer' ? (
            <>
              <ListEditor type="recognitions" />
              <SocialLinksForm links={values.social_links?.links ?? []} />
              <SettingForm settingKey="footer" value={values.footer} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
