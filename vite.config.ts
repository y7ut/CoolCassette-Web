import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_TRANSPORT': JSON.stringify(env.VITE_TRANSPORT || 'http'),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:7350',
          changeOrigin: true,
        },
      },
    },
  }
})
