import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { formatBytes, prepareImage } from '../lib/prepareImage'

const MAX_ORIGINAL = 25 * 1024 * 1024

/**
 * Image picker with a preview. Shows the current image, or the new file once chosen.
 * Large photos are resized in the browser first, so they upload even on servers with a small upload limit.
 */
export function ImageField({ id, currentUrl, file, onChange, accept = 'image/jpeg,image/png,image/webp', hint, invalid = false, processing = false }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const shown = preview ?? currentUrl
  const [note, setNote] = useState(null)
  const [problem, setProblem] = useState(null)
  const [busy, setBusy] = useState(false)

  async function choose(picked) {
    setNote(null)
    setProblem(null)
    if (!picked) return onChange(null)
    if (picked.size > MAX_ORIGINAL) {
      setProblem(`This file is ${formatBytes(picked.size)}. Choose an image under ${formatBytes(MAX_ORIGINAL)}.`)
      return
    }
    setBusy(true)
    try {
      const prepared = await prepareImage(picked)
      setNote(prepared.note)
      onChange(prepared.file)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className={`flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50 ${invalid ? 'border-danger' : 'border-border'}`}>
        {shown ? <img src={shown} alt="" className="h-full w-full object-cover" /> : <PhotoIcon className="h-8 w-8 text-muted" aria-hidden="true" />}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-brand-600 px-4 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-within:ring-2 focus-within:ring-brand-500">
          {shown ? 'Change image' : 'Choose image'}
          <input id={id} type="file" accept={accept} className="sr-only" onChange={(event) => { choose(event.target.files?.[0] ?? null); event.target.value = '' }} />
        </label>
        {busy ? <p className="text-xs text-muted">Preparing the image…</p> : null}
        {problem ? <p className="text-xs text-danger" role="alert">{problem}</p> : null}
        {note ? <p className="text-xs text-success">{note}</p> : null}
        {file && !note && !problem ? <p className="text-xs text-muted">{file.name} · {formatBytes(file.size)}</p> : null}
        {processing ? (
          <p className="text-xs text-amber-700" role="status">
            Finishing the last upload in the background. If it is still here after a minute, the background worker is not running: see Settings → System health.
          </p>
        ) : null}
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
    </div>
  )
}

ImageField.propTypes = {
  id: PropTypes.string.isRequired,
  currentUrl: PropTypes.string,
  file: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  accept: PropTypes.string,
  hint: PropTypes.string,
  invalid: PropTypes.bool,
  processing: PropTypes.bool,
}
