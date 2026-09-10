import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const basePath = env.BASE_PATH ?? '/';

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@workspace/api-client-react': path.resolve(
          import.meta.dirname,
          'lib/api-client-react/src'
        ),
        '@workspace/api-zod': path.resolve(
          import.meta.dirname,
          'lib/api-zod/src'
        ),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist'),
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
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) =>
            path.startsWith('/api/v1') ? path : path.replace(/^\/api/, '/api/v1'),
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
