<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster, toast } from 'vue-sonner'
import { useDarkMode } from '@/composables/useDarkMode'
import { registerToastImpl } from '@/stores/ui'

useDarkMode()

// 全局 toast 实现（vue-sonner；persistent = destructive 常驻，手动关闭）
onMounted(() => {
  registerToastImpl({
    success: (p, o) => toast.success(p.title, { description: p.description, duration: o?.duration ?? 3000 }),
    error: (p, o) => toast.error(p.title, { description: p.description, duration: o?.duration ?? 5000 }),
    info: (p, o) => toast.info(p.title, { description: p.description, duration: o?.duration ?? 3000 }),
    persistent: (p) => toast.error(p.title, { description: p.description, duration: Infinity, closeButton: true }),
  })
})

const route = useRoute()
const routeKey = computed(() => route.name as string)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page-fade" mode="out-in">
      <KeepAlive :include="['typing-page']">
        <component :is="Component" :key="routeKey" />
      </KeepAlive>
    </Transition>
  </RouterView>
  <Toaster position="top-center" :offset="16" close-button />
</template>
