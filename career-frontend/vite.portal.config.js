import { createAppConfig } from './vite.shared.js'

export default createAppConfig({
  port: 5174,
  outDir: 'dist/portal',
  html: 'portal.html',
})
