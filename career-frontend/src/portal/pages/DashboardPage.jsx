import { HeartIcon, PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { PageHeader } from '@shared/ui/Card'
import { EmptyState } from '@shared/ui/Skeleton'
import { useAuth } from '../features/auth/AuthProvider'

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div>
      <PageHeader
        title="Career Overview"
        subtitle={
          <span>
            Welcome back, {firstName}! Let's build a stronger team together. <HeartIcon className="inline h-4 w-4 text-danger" aria-hidden="true" />
          </span>
        }
        actions={
          <>
            <Button icon={PaperAirplaneIcon}>Post a Job</Button>
            <Button variant="secondary" icon={PlusIcon}>
              Send Job Alert
            </Button>
          </>
        }
      />
      <EmptyState
        title="The overview lands in a later phase"
        description="Jobs, candidates and the hiring pipeline are wired to this shell next. Sign-in, roles and the database are ready."
      />
    </div>
  )
}
