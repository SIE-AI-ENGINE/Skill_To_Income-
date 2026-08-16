import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Loads PORT / BASE_PATH from artifacts/sie-engine/.env (see .env.example)
  // in addition to whatever is already in process.env, so this works both
  // from `pnpm dev` (with a real .env file) and in CI/hosting where the
  // platform injects env vars directly.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  const port = Number(env.PORT ?? 5173);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${env.PORT}"`);
  }

  const basePath = env.BASE_PATH ?? '/';

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: true,
      },
      // Lets the frontend call relative "/api/..." paths in dev without
      // hardcoding a port; forwards them to the api-server. If you'd rather
      // call VITE_API_URL directly from the client, this proxy is optional.
      proxy: {
        '/api': {
          target: env.VITE_API_URL ?? 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
