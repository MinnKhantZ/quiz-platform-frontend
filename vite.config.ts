import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Custom logger that silences expected WebSocket disconnect noise.
// "write ECONNABORTED / ECONNRESET / EPIPE" is thrown whenever the browser
// closes a socket while Vite's WS proxy is still trying to write — completely
// benign after a live-quiz session ends.
const logger = createLogger();
const originalError = logger.error.bind(logger);
logger.error = (msg, opts) => {
  const benign = /ECONNABORTED|ECONNRESET|EPIPE/;
  if (benign.test(msg) || (opts?.error && benign.test((opts.error as Error).message ?? ''))) return;
  originalError(msg, opts);
};

export default defineConfig({
  customLogger: logger,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': BACKEND_URL,
      '/uploads': BACKEND_URL,
      '/socket.io': {
        target: BACKEND_URL,
        ws: true,
      },
    },
  },
})
