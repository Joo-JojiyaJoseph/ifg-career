import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))

function htmlEntry(html) {
  return {
    name: `html-entry-${html}`,
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const pathname = req.url?.split('?')[0] ?? ''
        const isInternal =
          pathname.startsWith('/@') ||
          pathname.startsWith('/src/') ||
          pathname.startsWith('/node_modules/') ||
          pathname.startsWith('/__')
        const wantsHtml = req.method === 'GET' && !pathname.includes('.') && !isInternal
        if (wantsHtml) {
          const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
          req.url = `/${html}${query}`
        }
        next()
      })
    },
  }
}

export function createAppConfig({ port, outDir, html }) {
  return defineConfig({
    plugins: [
      react(),
      htmlEntry(html),
      {
        name: `rename-${html}`,
        apply: 'build',
        writeBundle() {
          const from = path.resolve(root, outDir, html)
          const to = path.resolve(root, outDir, 'index.html')
          if (fs.existsSync(from)) {
            fs.renameSync(from, to)
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@shared': path.resolve(root, 'src/shared'),
        '@careers': path.resolve(root, 'src/careers'),
        '@portal': path.resolve(root, 'src/portal'),
      },
    },
    server: {
      port,
      strictPort: true,
    },
    preview: {
      port,
      strictPort: true,
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(root, html),
      },
    },
  })
}
