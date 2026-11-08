<script setup lang="ts">
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent } from 'reka-ui'
import { cn } from '@/utils/ui'

// 统一 AppTooltip：reka-ui 实现，delay 400ms 对齐原项目 Tooltip delayDuration
const props = withDefaults(
  defineProps<{
    content?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
    contentClass?: string
    disabled?: boolean
  }>(),
  { placement: 'top', delay: 400 },
)

const side = () =>
  ({ top: 'top', bottom: 'bottom', left: 'left', right: 'right' })[props.placement] as 'top' | 'bottom' | 'left' | 'right'
</script>

<template>
  <TooltipProvider :delay-duration="delay" :skip-delay-duration="100">
    <TooltipRoot>
      <TooltipTrigger as-child :disabled="disabled">
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side()"
          :side-offset="4"
          :class="
            cn(
              'z-50 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-xs text-gray-500 shadow-md dark:bg-gray-700 dark:text-gray-300',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
              contentClass,
            )
          "
        >
          <slot name="content">{{ content }}</slot>
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
