import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiConfigPlugin = {
    name: 'emotionlab-api-config',
    generateBundle() {
      const apiUrl = env.VITE_API_URL?.trim()
      if (!apiUrl) throw new Error('Falta VITE_API_URL para generar la configuración de producción.')
      this.emitFile({
        type: 'asset',
        fileName: 'api-config.json',
        source: JSON.stringify({ apiOrigin: new URL(apiUrl).origin }),
      })
    },
  }

  return {
    plugins: [react(), apiConfigPlugin],
    base: './',
  }
})
