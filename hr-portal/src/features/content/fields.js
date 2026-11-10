/**
 * Field definitions for each list-style content section. One generic editor renders all of them.
 */
export const sections = {
  'about-blocks': {
    title: 'The three numbered cards',
    noun: 'card',
    hint: 'How We Work, What We Provide and Our Culture, shown as 01, 02 and 03.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 80 },
      { name: 'body', label: 'Text', type: 'textarea', required: true, max: 600 },
      { name: 'heroicon_name', label: 'Icon', type: 'icon', required: true },
    ],
    summary: (item) => ({ title: item.title, text: item.body, icon: item.heroicon_name }),
  },
  'interview-steps': {
    title: 'Interview steps',
    noun: 'step',
    hint: 'Shown in order as 01, 02, 03… on the careers page and every job page. The last step is highlighted.',
    fields: [
      { name: 'name', label: 'Step name', type: 'text', required: true, max: 80 },
      { name: 'description', label: 'Short description', type: 'textarea', required: true, max: 255 },
    ],
    summary: (item, index) => ({ title: `${index + 1}. ${item.name}`, text: item.description }),
  },
  'media-items': {
    title: 'Culture photos and videos',
    noun: 'photo or video',
    hint: 'Real photos of your people (festivals, football, trips, birthdays) and YouTube videos. The first four photos fill the mosaic in “Why join”; videos appear below it.',
    fields: [
      { name: 'type', label: 'Kind', type: 'select', required: true, default: 'activity', options: [{ value: 'activity', label: 'Photo' }, { value: 'video', label: 'Video (YouTube)' }] },
      { name: 'title', label: 'Title', type: 'text', required: true, max: 150 },
      { name: 'youtube_url', label: 'YouTube link', type: 'text', required: true, max: 255, hint: 'For example https://www.youtube.com/watch?v=…', showIf: (values) => values.type === 'video' },
      { name: 'caption', label: 'Describe it', type: 'text', max: 255, hint: 'Read aloud by screen readers.' },
      { name: 'image', label: 'Photo', type: 'image', requiredOnCreate: true, hint: 'Landscape or square, at least 1200px wide. JPG, PNG or WebP, up to 3 MB.', showIf: (values) => values.type !== 'video' },
    ],
    summary: (item) => ({ title: item.type === 'video' ? `▶ ${item.title}` : item.title, text: item.caption, image: item.image_url }),
  },
  'employee-stories': {
    title: 'Employee experiences',
    noun: 'story',
    hint: 'A short quote from someone who works here. Publish only with their permission.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, max: 100 },
      { name: 'role', label: 'Role', type: 'text', required: true, max: 100 },
      { name: 'entity', label: 'Company', type: 'entity' },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true, max: 600 },
      { name: 'image', label: 'Photo (optional)', type: 'image', hint: 'A square head-and-shoulders photo. JPG, PNG or WebP, up to 3 MB. Initials are shown without one.' },
      { name: 'publish_permission_confirmed', label: 'The employee agreed to have this published', type: 'switch' },
    ],
    summary: (item) => ({ title: item.name, text: `“${item.quote}”`, image: item.image_url }),
  },
  'recruitment-drives': {
    title: 'Recruitment drives',
    noun: 'recruitment drive',
    hint: 'Walk-ins and campus drives that already happened, with a photo.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, max: 150 },
      { name: 'drive_date', label: 'Date', type: 'date', required: true },
      { name: 'caption', label: 'Describe the photo', type: 'text', max: 255 },
      { name: 'image', label: 'Photo', type: 'image', requiredOnCreate: true, hint: 'Landscape, at least 1200px wide. JPG, PNG or WebP, up to 3 MB.' },
    ],
    summary: (item) => ({ title: item.name, text: item.drive_date, image: item.image_url }),
  },
  recognitions: {
    title: 'Recognitions and validations',
    noun: 'recognition',
    hint: 'Certifications shown near the bottom of the careers page, such as ISO 27001.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, max: 150 },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'link', label: 'Link (optional)', type: 'text', max: 255, hint: 'A page that verifies it.' },
      { name: 'image', label: 'Badge', type: 'image', requiredOnCreate: true, accept: 'image/svg+xml,image/png,image/webp,image/jpeg', hint: 'The badge or seal. SVG or PNG works best.' },
    ],
    summary: (item) => ({ title: item.year ? `${item.name} · ${item.year}` : item.name, text: item.link, image: item.image_url }),
  },
  faqs: {
    title: 'Questions and answers',
    noun: 'question',
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true, max: 255 },
      { name: 'answer', label: 'Answer', type: 'richtext', required: true },
    ],
    summary: (item) => ({ title: item.question, html: item.answer }),
  },
}

export const settingForms = {
  hero: {
    title: 'Opening banner',
    hint: 'The first thing visitors see, over a full-width photo.',
    fields: [
      { name: 'eyebrow', label: 'Small line above the name', type: 'text', max: 60, hint: 'For example “Be part of our heart”.' },
      { name: 'title', label: 'Big headline', type: 'text', max: 60, hint: 'For example “Infolks Group”.' },
      { name: 'motto', label: 'Tagline', type: 'text', required: true, max: 120 },
      { name: 'company_line', label: 'Short description of the company', type: 'textarea', max: 240, hint: 'One or two sentences shown under the headline.' },
      { name: 'image', label: 'Background photo', type: 'image', current: 'banner_image_url', hint: 'A wide, lively team photo, at least 2000px wide. It is converted to WebP automatically.' },
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
  entities_section: {
    title: 'Section heading',
    fields: [
      { name: 'title', label: 'Heading', type: 'text', required: true, max: 80 },
      { name: 'intro', label: 'Short introduction (optional)', type: 'textarea', max: 300 },
    ],
  },
  about_intro: {
    title: 'Section heading',
    fields: [
      { name: 'title', label: 'Heading', type: 'text', required: true, max: 80 },
      { name: 'intro', label: 'Introduction', type: 'textarea', max: 600, hint: 'Leave an empty line between paragraphs.' },
    ],
  },
  interview_section: {
    title: 'Section heading',
    fields: [
      { name: 'eyebrow', label: 'Small line above the heading', type: 'text', max: 60 },
      { name: 'title', label: 'Heading', type: 'text', required: true, max: 80 },
      { name: 'image', label: 'Background photo', type: 'image', current: 'image_url', hint: 'Shown dimmed behind the steps. Landscape, at least 1600px wide.' },
    ],
  },
  quick_apply_section: {
    title: 'Section heading',
    fields: [
      { name: 'title', label: 'Heading', type: 'text', required: true, max: 80 },
      { name: 'intro', label: 'Introduction', type: 'textarea', max: 400, hint: 'Leave an empty line between paragraphs. The first paragraph is shown larger.' },
      { name: 'image', label: 'Photo beside the form', type: 'image', current: 'image_url', hint: 'Landscape, at least 1200px wide.' },
    ],
  },
  faq_section: {
    title: 'Section heading',
    fields: [{ name: 'title', label: 'Heading', type: 'text', required: true, max: 80 }],
  },
  footer: {
    title: 'Footer',
    fields: [
      { name: 'closing_title', label: 'Closing heading', type: 'text', max: 80, hint: 'Optional. Leave empty to show only the message.' },
      { name: 'closing_text', label: 'Closing message', type: 'textarea', max: 300 },
      { name: 'copyright', label: 'Copyright line', type: 'text', required: true, max: 150 },
      { name: 'contact_email', label: 'Contact email', type: 'text' },
      { name: 'contact_phone', label: 'Contact phone', type: 'text' },
      { name: 'address', label: 'Head office address', type: 'text', max: 200 },
      { name: 'tagline', label: 'Group tagline', type: 'text', max: 120 },
    ],
  },
  quick_apply_confirmation_text: {
    title: 'Thank-you message',
    hint: 'Shown after someone sends Quick Apply.',
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
