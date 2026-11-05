import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@shared/ui/Toast'
import { downloadExport, fetchExport, queueExport } from './api'

/** Starts a queued export and toasts when the file is ready. */
export function useQueuedExport(type) {
  const toast = useToast()
  const [exportId, setExportId] = useState(null)
  const told = useRef(null)
  const job = useQuery({
    queryKey: ['hr-export', exportId],
    queryFn: () => fetchExport(exportId),
    enabled: Boolean(exportId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (!status || status === 'queued' || status === 'processing') return 2000
      return false
    },
  })

  useEffect(() => {
    const current = job.data
    if (!current || (current.status !== 'ready' && current.status !== 'failed')) return
    const marker = `${current.id}:${current.status}`
    if (told.current === marker) return
    told.current = marker
    if (current.status === 'ready') {
      toast.push({
        tone: 'success',
        message: 'Export ready to download',
        duration: 8000,
        action: {
          label: 'Download',
          onClick: () => downloadExport(current.id, `infolks-group-${type}.xlsx`),
        },
      })
      return
    }
    toast.push({ tone: 'error', message: 'The export could not be created. Please try again.' })
  }, [job.data, toast, type])

  async function start(filters) {
    const created = await queueExport(type, filters)
    told.current = null
    if (created.status === 'ready') {
      toast.push({
        tone: 'success',
        message: 'Export ready to download',
        duration: 8000,
        action: {
          label: 'Download',
          onClick: () => downloadExport(created.id, `infolks-group-${type}.xlsx`),
        },
      })
      return
    }
    if (created.status === 'failed') {
      toast.push({ tone: 'error', message: 'The export could not be created. Please try again.' })
      return
    }
    toast.push({ tone: 'info', message: 'Export queued. We will let you know when it is ready.' })
    setExportId(created.id)
  }

  return { start, pending: job.isFetching }
}
