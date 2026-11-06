import { useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { PhotoIcon } from '@heroicons/react/24/outline'

/**
 * Image picker with a preview. Shows the current image, or the new file once chosen.
 */
export function ImageField({ id, currentUrl, file, onChange, accept = 'image/jpeg,image/png,image/webp', hint, invalid = false, processing = false }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const shown = preview ?? currentUrl

  return (
    <div className="flex items-center gap-4">
      <div className={`flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50 ${invalid ? 'border-danger' : 'border-border'}`}>
        {shown ? <img src={shown} alt="" className="h-full w-full object-cover" /> : <PhotoIcon className="h-8 w-8 text-muted" aria-hidden="true" />}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-brand-600 px-4 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-within:ring-2 focus-within:ring-brand-500">
          {shown ? 'Change image' : 'Choose image'}
          <input id={id} type="file" accept={accept} className="sr-only" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
        </label>
        {processing ? <p className="text-xs text-amber-700">Processing the last upload…</p> : null}
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
