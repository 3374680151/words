<script setup lang="ts">
import { ProgressRoot, ProgressIndicator } from 'reka-ui'
import { cn } from '@/utils/ui'

const props = withDefaults(
  defineProps<{
    value?: number
    max?: number
    class?: string
    indicatorClass?: string
  }>(),
  { max: 100 },
)

const pct = () => Math.min(100, Math.max(0, ((props.value ?? 0) / props.max) * 100))
</script>

<template>
  <ProgressRoot
    :model-value="value"
    :max="max"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700', $props.class)"
  >
    <ProgressIndicator
      class="h-full rounded-full bg-indigo-500 transition-all duration-300"
      :class="indicatorClass"
      :style="{ width: `${pct()}%` }"
    />
  </ProgressRoot>
</template>
