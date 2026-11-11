import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))

// Infolks Group careers site: a standalone Vite app (port 5173).
export default defineConfig(({ mode }) => {
  // Optional for development: VITE_API_PROXY=http://career-backend.test (Laravel Herd, Valet, Laragon …).
  // The dev server then forwards API calls, so the browser sees one site and keeps the sign-in cookies.
  const env = loadEnv(mode, root, '')
  const proxyTarget = env.VITE_API_PROXY
  const forward = (target) => ({ target, changeOrigin: true, secure: false, cookieDomainRewrite: { '*': '' } })
  const proxy = proxyTarget
    ? Object.fromEntries(['/api', '/sanctum', '/storage'].map((prefix) => [prefix, forward(proxyTarget)]))
    : // Without a proxy, still forward Google's return trip, so a redirect address of
      // http://localhost:5173/api/v1/auth/google/callback works with "php artisan serve" as well.
      env.VITE_API_URL
      ? { '/api/v1/auth/google': forward(env.VITE_API_URL) }
      : undefined

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(root, 'src/shared'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy,
    },
    preview: {
      port: 5173,
      strictPort: true,
    },
  }
})
