import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))

// Infolks Group HR portal: a standalone Vite app (port 5174).
export default defineConfig(({ mode }) => {
  // Optional for development: VITE_API_PROXY=http://career-backend.test (Laravel Herd, Valet, Laragon …).
  // The dev server then forwards API calls, so the browser sees one site and keeps the sign-in cookies.
  const proxyTarget = loadEnv(mode, root, '').VITE_API_PROXY
  const proxy = proxyTarget
    ? Object.fromEntries(
        ['/api', '/sanctum', '/storage'].map((prefix) => [
          prefix,
          { target: proxyTarget, changeOrigin: true, secure: false, cookieDomainRewrite: { '*': '' } },
        ]),
      )
    : undefined

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(root, 'src/shared'),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy,
    },
    preview: {
      port: 5174,
      strictPort: true,
    },
  }
})
