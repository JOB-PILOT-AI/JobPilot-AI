import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || `http://localhost:${env.PORT || 5000}`

  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        },
        '/auth/google/callback': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth/, '/api/auth')
        },
        '/auth/github/callback': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth/, '/api/auth')
        }
      }
    }
  }
})
