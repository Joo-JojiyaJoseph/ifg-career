/**
 * Field definitions for each list-style content section. One generic editor renders all of them.
 */
export const sections = {
  'about-blocks': {
    title: 'About the group: blocks',
    noun: 'block',
    hint: 'Three blocks: How we work, What we provide, Our culture.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 80 },
      { name: 'body', label: 'Text', type: 'textarea', required: true, max: 600 },
      { name: 'heroicon_name', label: 'Icon', type: 'icon', required: true },
    ],
    summary: (item) => ({ title: item.title, text: item.body, icon: item.heroicon_name }),
  },
  'interview-steps': {
    title: 'Interview process',
    noun: 'step',
    hint: 'Shown in order as numbered steps on the landing page and every job page.',
    fields: [
      { name: 'name', label: 'Step name', type: 'text', required: true, max: 80 },
      { name: 'description', label: 'Short description', type: 'textarea', required: true, max: 255 },
    ],
    summary: (item, index) => ({ title: `${index + 1}. ${item.name}`, text: item.description }),
  },
  'employee-stories': {
    title: 'Employee experiences',
    noun: 'story',
    hint: 'Only stories with the employee’s permission can be published.',
    fields: [
      { name: 'name', label: 'Employee name', type: 'text', required: true, max: 100 },
      { name: 'role', label: 'Role', type: 'text', required: true, max: 100 },
      { name: 'entity', label: 'Entity', type: 'entity' },
      { name: 'quote', label: 'Quote or short story', type: 'textarea', required: true, max: 600 },
      { name: 'image', label: 'Photo', type: 'image', hint: 'A square photo works best. JPG, PNG or WebP, up to 3 MB.' },
      { name: 'publish_permission_confirmed', label: 'The employee agreed to publish this', type: 'switch' },
    ],
    summary: (item) => ({ title: item.name, text: `${item.role}${item.entity ? ` · ${item.entity.name}` : ''}`, image: item.image_url }),
  },
  'recruitment-drives': {
    title: 'Recruitment drives',
    noun: 'drive photo',
    fields: [
      { name: 'name', label: 'Drive name', type: 'text', required: true, max: 150 },
      { name: 'drive_date', label: 'Date', type: 'date', required: true },
      { name: 'caption', label: 'Caption', type: 'text', max: 255 },
      { name: 'image', label: 'Photo', type: 'image', requiredOnCreate: true, hint: 'Landscape photos look best. Up to 3 MB.' },
    ],
    summary: (item) => ({ title: item.name, text: item.caption, image: item.image_url, date: item.drive_date }),
  },
  'media-items': {
    title: 'Videos and activities',
    noun: 'item',
    hint: 'Optional. The tab is hidden on the site when this list is empty.',
    fields: [
      { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'video', label: 'Video (YouTube)' }, { value: 'activity', label: 'Activity photo' }] },
      { name: 'title', label: 'Title', type: 'text', required: true, max: 150 },
      { name: 'youtube_url', label: 'YouTube link', type: 'text', showIf: (values) => values.type === 'video' },
      { name: 'image', label: 'Photo', type: 'image', showIf: (values) => values.type === 'activity' },
      { name: 'caption', label: 'Caption', type: 'text', max: 255 },
    ],
    summary: (item) => ({ title: item.title, text: item.type === 'video' ? item.youtube_url : item.caption, image: item.image_url }),
  },
  faqs: {
    title: 'Frequently asked questions',
    noun: 'question',
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true, max: 255 },
      { name: 'answer', label: 'Answer', type: 'richtext', required: true },
    ],
    summary: (item) => ({ title: item.question, html: item.answer }),
  },
  recognitions: {
    title: 'Recognitions and validations',
    noun: 'badge',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, max: 150 },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'link', label: 'Link (optional)', type: 'text' },
      { name: 'image', label: 'Badge image', type: 'image', requiredOnCreate: true, accept: 'image/png,image/webp,image/svg+xml,image/jpeg' },
    ],
    summary: (item) => ({ title: item.name, text: item.year ? String(item.year) : '', image: item.image_url }),
  },
}

export const settingForms = {
  hero: {
    title: 'Opening banner',
    fields: [
      { name: 'motto', label: 'Motto or key words', type: 'text', required: true, max: 120 },
      { name: 'company_line', label: 'Short line about the company', type: 'textarea', max: 240 },
      { name: 'image', label: 'Banner image', type: 'image', current: 'banner_image_url', hint: 'Wide image, at least 1600px. It is converted to WebP automatically.' },
    ],
  },
  company_numbers: {
    title: 'Company numbers',
    hint: 'Optional animated counters under the banner. Leave all empty to hide them.',
    fields: [
      { name: 'employees', label: 'Employees', type: 'number' },
      { name: 'years', label: 'Years in business', type: 'number' },
      { name: 'clients', label: 'Clients served', type: 'number' },
    ],
  },
  about_intro: {
    title: 'About the group: introduction',
    fields: [
      { name: 'title', label: 'Section title', type: 'text', required: true, max: 80 },
      { name: 'intro', label: 'Introduction', type: 'textarea', max: 600 },
    ],
  },
  footer: {
    title: 'Footer',
    fields: [
      { name: 'copyright', label: 'Copyright line', type: 'text', required: true, max: 150 },
      { name: 'contact_email', label: 'Contact email', type: 'text' },
      { name: 'contact_phone', label: 'Contact phone', type: 'text' },
      { name: 'address', label: 'Head office address', type: 'text', max: 200 },
      { name: 'tagline', label: 'Group tagline', type: 'text', max: 120 },
    ],
  },
  quick_apply_confirmation_text: {
    title: 'Quick apply confirmation message',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 80 },
      { name: 'body', label: 'Message', type: 'textarea', required: true, max: 400 },
    ],
  },
  promo_card: {
    title: 'Portal promo card',
    hint: 'Shown on the HR dashboard.',
    fields: [
      { name: 'headline', label: 'Headline', type: 'text', required: true, max: 80 },
      { name: 'tagline', label: 'Tagline', type: 'text', max: 120 },
      { name: 'image', label: 'Image', type: 'image', current: 'image_url' },
    ],
  },
}
