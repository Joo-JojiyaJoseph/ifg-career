import { useEffect } from 'react'
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
      run: () => {
        const previous = editor.getAttributes('link').href ?? 'https://'
        const href = window.prompt('Link address (https://…)', previous)
        if (href === null) return
        if (href === '' || href === 'https://') editor.chain().focus().unsetLink().run()
        else if (/^(https:\/\/|mailto:)/i.test(href)) editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
      },
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
