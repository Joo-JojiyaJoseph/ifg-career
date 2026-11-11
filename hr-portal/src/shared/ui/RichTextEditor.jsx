import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BoldIcon,
  H2Icon,
  H3Icon,
  ItalicIcon,
  LinkIcon,
  ListBulletIcon,
  NumberedListIcon,
  UnderlineIcon,
} from '@heroicons/react/24/outline'
import { Button } from './Button'
import { Input } from './Input'
import { Modal } from './Modal'

/**
 * Small rich text editor (TipTap). Output is HTML; the API sanitises it again on save.
 * Load it lazily: `const RichTextEditor = lazy(() => import('@shared/ui/RichTextEditor'))`.
 */
export default function RichTextEditor({ id, value = '', onChange, invalid = false, describedBy, placeholder = 'Write here…' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        link: { openOnClick: false, autolink: true, protocols: ['https', 'mailto'], HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-describedby': describedBy ?? '',
        'aria-invalid': invalid ? 'true' : 'false',
        'data-placeholder': placeholder,
        class: 'prose prose-sm max-w-none min-h-40 px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
    immediatelyRender: false,
  })

  // The link being added or edited: null when the link dialog is closed.
  const [link, setLink] = useState(null)
  const linkValid = link !== null && (link === '' || link === 'https://' || /^(https:\/\/\S+|mailto:\S+)$/i.test(link.trim()))

  function saveLink(event) {
    event.preventDefault()
    if (!linkValid) return
    const href = link.trim()
    if (href === '' || href === 'https://') editor.chain().focus().unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    setLink(null)
  }

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  if (!editor) return <div className="min-h-48 rounded-xl border border-border bg-slate-50" aria-hidden="true" />

  const tools = [
    { label: 'Bold', icon: BoldIcon, run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { label: 'Italic', icon: ItalicIcon, run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { label: 'Underline', icon: UnderlineIcon, run: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
    { label: 'Heading', icon: H2Icon, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
    { label: 'Subheading', icon: H3Icon, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
    { label: 'Bulleted list', icon: ListBulletIcon, run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { label: 'Numbered list', icon: NumberedListIcon, run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    {
      label: 'Link',
      icon: LinkIcon,
      active: editor.isActive('link'),
      run: () => setLink(editor.getAttributes('link').href ?? 'https://'),
    },
    { label: 'Undo', icon: ArrowUturnLeftIcon, run: () => editor.chain().focus().undo().run() },
    { label: 'Redo', icon: ArrowUturnRightIcon, run: () => editor.chain().focus().redo().run() },
  ]

  return (
    <div className={`overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-brand-500 ${invalid ? 'border-danger' : 'border-border'}`}>
      <div className="flex flex-wrap gap-1 border-b border-border bg-slate-50 p-1" role="toolbar" aria-label="Formatting">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={tool.run}
            aria-label={tool.label}
            aria-pressed={tool.active ?? undefined}
            title={tool.label}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-lg text-navy hover:bg-white ${tool.active ? 'bg-white text-brand-700 shadow-sm' : ''}`}
          >
            <tool.icon className="h-5 w-5" aria-hidden="true" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <Modal
        open={link !== null}
        onClose={() => setLink(null)}
        title={editor.isActive('link') ? 'Edit link' : 'Add a link'}
        description="Use a web address starting with https:// or an email starting with mailto:. Leave it empty to remove the link."
        icon={LinkIcon}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLink(null)}>Cancel</Button>
            <Button type="submit" form={`${id ?? 'editor'}-link-form`} disabled={!linkValid}>Save link</Button>
          </>
        }
      >
        <form id={`${id ?? 'editor'}-link-form`} onSubmit={saveLink}>
          <label htmlFor={`${id ?? 'editor'}-link`} className="mb-1.5 block text-sm font-medium text-navy">Link address</label>
          <Input
            id={`${id ?? 'editor'}-link`}
            value={link ?? ''}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://"
            inputMode="url"
            invalid={!linkValid}
            aria-describedby={linkValid ? undefined : `${id ?? 'editor'}-link-error`}
            data-autofocus
          />
          {linkValid ? null : <p id={`${id ?? 'editor'}-link-error`} className="mt-1.5 text-sm text-danger">Start with https:// or mailto:</p>}
        </form>
      </Modal>
    </div>
  )
}

RichTextEditor.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  invalid: PropTypes.bool,
  describedBy: PropTypes.string,
  placeholder: PropTypes.string,
}
