<script setup lang="ts">
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/utils/ui'

// shadcn Sheet（侧边抽屉）：原项目 Drawer 的标准替代
// 宽度响应式修复：w-[min(35rem,92vw)]（原项目固定 35rem 窄窗溢出）
withDefaults(
  defineProps<{
    open?: boolean
    side?: 'left' | 'right' | 'top' | 'bottom'
    title?: string
    contentClass?: string
  }>(),
  { side: 'left' },
)

const emit = defineEmits<{ 'update:open': [v: boolean] }>()

const sideClasses: Record<string, string> = {
  left: 'inset-y-0 left-0 h-full w-[min(35rem,92vw)] border-r data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left duration-300',
  right:
    'inset-y-0 right-0 h-full w-[min(35rem,92vw)] border-l data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right duration-300',
  top: 'inset-x-0 top-0 border-b data-[state=open]:animate-in data-[state=open]:slide-in-from-top data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top duration-300',
  bottom:
    'inset-x-0 bottom-0 border-t data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom duration-300',
}
</script>

<template>
  <DialogRoot :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogTrigger as-child v-if="$slots.default">
      <slot />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/25 transition-opacity duration-300 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <DialogContent :class="cn('fixed z-50 flex flex-col gap-4 bg-white p-6 shadow-2xl dark:bg-gray-800', sideClasses[side], contentClass)">
        <div v-if="title || $slots.title" class="flex items-center justify-between">
          <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            <slot name="title">{{ title }}</slot>
          </DialogTitle>
          <DialogClose class="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
            <X class="h-5 w-5" />
            <span class="sr-only">关闭</span>
          </DialogClose>
        </div>
        <slot name="content" />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
