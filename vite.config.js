import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { WORKSPACE_ROOT } from './scripts/workspace-paths.mjs';

export default defineConfig(({ mode }) => {
  // Read the shared repository .env, but keep all private variables out of
  // Vite's client environment. Vite only receives the public VITE_ prefix.
  const env = loadEnv(mode, WORKSPACE_ROOT, 'VITE_');
  const apiConfigPlugin = {
    name: 'emotionlab-api-config',
    generateBundle() {
      const apiUrl = env.VITE_API_URL?.trim();
      if (!apiUrl) throw new Error('Falta VITE_API_URL en el .env raíz o en el entorno de compilación.');
      this.emitFile({
        type: 'asset',
        fileName: 'api-config.json',
        source: JSON.stringify({ apiOrigin: new URL(apiUrl).origin }),
      });
    },
  };

  return {
    envDir: WORKSPACE_ROOT,
    envPrefix: 'VITE_',
    plugins: [react(), apiConfigPlugin],
    base: './',
  };
});
