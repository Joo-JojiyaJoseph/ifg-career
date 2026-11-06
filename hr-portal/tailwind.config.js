import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import preset from './src/shared/ui/tailwind.preset.js'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  plugins: [forms, typography],
}
