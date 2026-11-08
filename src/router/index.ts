import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'typing',
    component: () => import('@/pages/Typing/index.vue'),
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('@/pages/Gallery/index.vue'),
  },
  {
    path: '/analysis',
    name: 'analysis',
    component: () => import('@/pages/Analysis/index.vue'),
  },
  {
    path: '/error-book',
    name: 'error-book',
    component: () => import('@/pages/ErrorBook/index.vue'),
  },
  {
    path: '/friend-links',
    name: 'friend-links',
    component: () => import('@/pages/FriendLinks/index.vue'),
  },
  {
    // dev-only：特效试验场（所有库组件接入业务前在此目检）
    path: '/fx-lab',
    name: 'fx-lab',
    component: () => import('@/pages/FxLab/index.vue'),
  },
  {
    // dev-only：逻辑层自检（数据兼容/状态机/复习双写/词表断言）
    path: '/dev-selftest',
    name: 'dev-selftest',
    component: () => import('@/pages/DevSelftest/index.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

// GitHub Pages 部署时 basename 对齐 vite base
const base = import.meta.env.BASE_URL

const router = createRouter({
  history: createWebHistory(base),
  routes,
})

export default router
