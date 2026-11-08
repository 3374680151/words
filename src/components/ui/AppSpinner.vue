<script setup lang="ts">
// 统一 Spinner（原项目 LoadingUI 样式，消灭复制粘贴）
withDefaults(defineProps<{ class?: string }>(), {})
</script>

<template>
  <div
    class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
    :class="$props.class"
    role="status"
    aria-label="加载中"
  />
</template>
