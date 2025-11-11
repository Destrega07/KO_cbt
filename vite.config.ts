import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 读取 .env（包括 VITE_ 前缀变量）
  const env = loadEnv(mode, process.cwd(), '')
  const port = 5173

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
      // 代替已废弃的 server.force
      force: true,
    },
    server: {
      port,
      strictPort: false,
    },
    // GitHub Pages 部署需要设置 base 路径
    base: mode === 'production' ? '/KO_cbt/' : '/',
    // 显式注入关键环境变量，确保客户端可用
    define: {
      'import.meta.env.VITE_DASHSCOPE_API_KEY': JSON.stringify(env.VITE_DASHSCOPE_API_KEY),
      'import.meta.env.VITE_DASHSCOPE_BASE_URL': JSON.stringify(env.VITE_DASHSCOPE_BASE_URL),
      'import.meta.env.VITE_QWEN_MODEL_NAME': JSON.stringify(env.VITE_QWEN_MODEL_NAME),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
});
