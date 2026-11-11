import { useQuery } from '@tanstack/react-query'
import { ErrorState } from '@shared/ui/ErrorState'
import { Skeleton } from '@shared/ui/Skeleton'
import { EntitiesEditor } from '../content/EntitiesEditor'
import { fetchEntityContent, anyProcessing } from '../content/api'

/** Settings → Companies: add, edit and delete the group's companies, with their details, colours and images. */
export function CompaniesPanel() {
  const entities = useQuery({ queryKey: ['hr-content', 'entities'], queryFn: fetchEntityContent, refetchInterval: (query) => (anyProcessing(query.state.data) ? 4000 : false) })

  if (entities.isLoading) return <Skeleton className="h-64" />
  if (entities.isError) return <ErrorState onRetry={() => entities.refetch()} />
  return <EntitiesEditor entities={entities.data ?? []} />
}
