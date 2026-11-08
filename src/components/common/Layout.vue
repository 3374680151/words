<script setup lang="ts">
import AppFooter from './AppFooter.vue'

// 平移自原项目 components/Layout.tsx：<main class="flex h-screen w-full flex-col items-center pb-4">{children}<Footer/></main>
</script>

<template>
  <main class="flex h-screen w-full flex-col items-center pb-4">
    <slot />
    <AppFooter />
  </main>
</template>
