<script setup lang="ts">
// 平移自原项目 TipAlert：插件冲突提示（destructive Alert，点击关闭）
import PhWarning from '~icons/ph/warning'

defineProps<{
  className?: string
  show: boolean
  setShow: (show: boolean) => void
}>()
</script>

<template>
  <div v-if="show" :class="`z-10 w-fit cursor-pointer pr-5 ${className ?? ''}`" @click="setShow(false)">
    <div class="relative flex w-fit gap-2 rounded-lg border bg-white p-4 pr-8 text-gray-900 shadow-xl dark:bg-gray-800 dark:text-gray-50">
      <PhWarning class="h-4 w-4 shrink-0 text-red-500" />
      <div>
        <p class="mb-1 font-semibold">插件冲突！</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">如果多次输入失败，可能是与本地浏览器插件冲突，请关闭相关插件或切换浏览器试试</p>
      </div>
    </div>
  </div>
</template>
