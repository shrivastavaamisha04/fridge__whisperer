import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Dev only: serve api/*.ts (Vercel serverless functions) from the Vite dev server,
// so /api/gemini and /api/transcribe work with `npm run dev` like they do on Vercel.
function vercelApiDev(env: Record<string, string>): Plugin {
  return {
    name: 'vercel-api-dev',
    apply: 'serve',
    configureServer(server) {
      // Server-side secrets (no VITE_ prefix) are exposed to the functions, never to the client bundle
      for (const [key, value] of Object.entries(env)) {
        if (!key.startsWith('VITE_') && process.env[key] === undefined) process.env[key] = value;
      }
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/([a-z0-9-]+)\/?(?:\?|$)/i);
        if (!match) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
          let raw = '';
          for await (const chunk of req) raw += chunk;
          const vercelReq = Object.assign(req, { body: raw ? JSON.parse(raw) : undefined });
          const vercelRes = Object.assign(res, {
            status(code: number) { res.statusCode = code; return vercelRes; },
            json(body: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); },
          });
          await mod.default(vercelReq, vercelRes);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load ALL env vars from .env.local (empty prefix = load everything, not just VITE_)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), vercelApiDev(env)],
    base: './',
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
