import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

// 后端协议: 与 nps 启动参数保持一致 —— 后端用 NPS_SCHEME=http 启动时,
// 开发服务器同样用 NPS_SCHEME=http npm run dev (默认 https)。
// 后端端口非 33000 或需要指定完整地址时, 用 NPS_DEV_TARGET 直接覆盖。
const backendScheme =
  (process.env.NPS_SCHEME || 'https').toLowerCase() === 'http' ? 'http' : 'https'
const backendTarget = process.env.NPS_DEV_TARGET || `${backendScheme}://127.0.0.1:33000`

// https://vitejs.dev/config/
export default defineConfig({
  // 相对路径，保证在动态 admin 前缀下(如 /manjusaka/static/)资源仍可加载
  base: './',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 开发服务器 esbuild 转换目标: 支持 top-level await
  // (noVNC browser.js 与 rustrdp wasm 加载均用到 TLA)
  esbuild: {
    target: 'esnext',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static/assets',
    chunkSizeWarningLimit: 1500,
    // 支持 top-level await (rustrdp wasm 加载需要)
    target: 'esnext',
    rollupOptions: {
      output: {
        // 仅手动聚合框架核心与终端库; element-plus 交由路由懒加载按需拆分,
        // 避免把所有用到的组件塞进一个巨大的预加载 chunk。
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          xterm: ['@xterm/xterm', '@xterm/addon-fit'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // 本地开发时，默认代理到 /manjusaka/ 前缀的后端
      '/manjusaka': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
        ws: true,
        // 仅 https 后端需要: 后端会话 cookie 带 Secure + SameSite=None (为生产
        // HTTPS 跨域直连设计), 开发代理是 http 明文同源, 浏览器会丢弃 Secure
        // cookie 导致登录失败, 这里改写 Set-Cookie (去 Secure、SameSite 降 Lax)。
        // http 后端本身已发非 Secure + Lax cookie, 无需处理。
        ...(backendScheme === 'https'
          ? {
              configure(proxy) {
                proxy.on('proxyRes', (proxyRes) => {
                  const cookies = proxyRes.headers['set-cookie']
                  if (!cookies) return
                  proxyRes.headers['set-cookie'] = cookies.map((c) =>
                    c
                      .replace(/;\s*secure/gi, '')
                      .replace(/;\s*samesite\s*=\s*none/gi, '; SameSite=Lax'),
                  )
                })
              },
            }
          : {}),
      },
    },
  },
  optimizeDeps: {
    include: ['@novnc/novnc/core/rfb.js'],
    // 依赖预打包(esbuild)目标: 支持 top-level await
    esbuildOptions: {
      target: 'esnext',
    },
  },
})
