<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaViewport, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaCorner } from 'reka-ui'
import { cn } from '@/utils/ui'

withDefaults(
  defineProps<{
    class?: string
    viewportClass?: string
  }>(),
  {},
)
</script>

<template>
  <ScrollAreaRoot :class="cn('relative overflow-hidden', $props.class)">
    <ScrollAreaViewport class="h-full w-full rounded-[inherit] outline-none" :class="viewportClass">
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      orientation="vertical"
      class="flex w-2.5 touch-none select-none border-l border-l-transparent p-[1px] transition-colors hover:bg-slate-100 dark:hover:bg-gray-700"
    >
      <ScrollAreaThumb class="relative flex-1 rounded-full bg-slate-200 dark:bg-gray-600" />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
