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
      port: 5173,
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
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.startsWith('/api/v1') ? path : path.replace(/^\/api/, '/api/v1'),
        },
      },
    },
    preview: {
      port: 5173,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});