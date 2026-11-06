import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@shared/ui/Toast'
import { downloadExport } from '../exports/api'
import { fetchUnread, markAllRead, markRead } from './api'

const POLL_MS = 30_000

/**
 * Unread count + latest items for the bell. Polls every 30 seconds while the tab is visible
 * and shows a toast when something new arrives.
 */
export function useNotifications() {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const seen = useRef(null)
  const unread = useQuery({
    queryKey: ['hr-notifications', 'unread'],
    queryFn: fetchUnread,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
    meta: { silent: true },
  })

  useEffect(() => {
    const latest = unread.data?.latest ?? []
    if (!latest.length) return
    const ids = latest.map((item) => item.id)
    if (seen.current) {
      const fresh = latest.filter((item) => !seen.current.has(item.id))
      if (fresh.length === 1) toast.push({ tone: fresh[0].level === 'warning' ? 'warning' : 'info', message: fresh[0].title, duration: 6000 })
      if (fresh.length > 1) toast.push({ tone: 'info', message: `${fresh.length} new notifications`, duration: 6000 })
    }
    seen.current = new Set([...(seen.current ?? []), ...ids])
  }, [unread.data, toast])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['hr-notifications'] })

  const readOne = useMutation({ mutationFn: markRead, onSuccess: refresh })
  const readAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'All notifications marked as read' })
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  function open(item) {
    if (!item.read_at) readOne.mutate(item.id)
    if (item.download_path) {
      const id = item.download_path.split('/').at(-2)
      downloadExport(id, 'infolks-group-export.xlsx').catch((error) => toast.push({ tone: 'error', message: error.status === 410 || error.status === 404 ? 'This export link has expired. Run the export again.' : error.message }))
      return
    }
    if (item.url) navigate(item.url)
  }

  return {
    count: unread.data?.unread ?? 0,
    items: unread.data?.latest ?? [],
    open,
    markAll: () => readAll.mutate(),
  }
}
