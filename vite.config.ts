
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load ALL env vars from .env.local (empty prefix = load everything, not just VITE_)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './',
    define: {
      // Gemini key — supports both VITE_API_KEY and API_KEY naming
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || ''),
      // Sarvam key
      'process.env.SARVAM_API_KEY': JSON.stringify(env.SARVAM_API_KEY || ''),
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
