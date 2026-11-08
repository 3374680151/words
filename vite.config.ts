import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

// 与原项目对齐：GitHub Pages 部署时设 VITE_DEPLOY_ENV=pages，资源前缀与 basename 相应切换
export default defineConfig(({ mode }) => {
  const isPages = mode === 'pages' || process.env.VITE_DEPLOY_ENV === 'pages'
  return {
    plugins: [
      vue(),
      Icons({
        compiler: 'vue3',
        customCollections: {
          // 原项目自定义集合：小红书图标（src/assets/xiaohongshu.svg）
          'my-icons': {
            xiaohongshu: () => readFileSync(fileURLToPath(new URL('./src/assets/xiaohongshu.svg', import.meta.url)), 'utf-8'),
          },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      __COMMIT_HASH__: JSON.stringify(process.env.COMMIT_HASH ?? 'dev'),
    },
    base: isPages ? '/qwerty-learner-vue/' : './',
  }
})
