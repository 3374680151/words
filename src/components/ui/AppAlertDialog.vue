<script setup lang="ts">
import {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from 'reka-ui'
import { cn } from '@/utils/ui'

// 删除/覆盖类操作的二次确认（开发规范要求）
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    destructive?: boolean
    confirmLoading?: boolean
  }>(),
  { confirmText: '确认', cancelText: '取消', destructive: true },
)

const emit = defineEmits<{ confirm: []; 'update:open': [v: boolean] }>()
const open = defineModel<boolean>('open', { default: false })

function onConfirm() {
  emit('confirm')
  // 由调用方在异步完成后自行关闭（confirmLoading 场景）
  if (!props.confirmLoading) open.value = false
}
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="(v: boolean) => (open = v)">
    <AlertDialogTrigger as-child v-if="$slots.default">
      <slot />
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <AlertDialogContent
        :class="
          cn(
            'fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xl duration-200',
            'dark:border-gray-700 dark:bg-gray-800',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          )
        "
      >
        <AlertDialogTitle class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="description" class="text-sm text-gray-500 dark:text-gray-400">
          {{ description }}
        </AlertDialogDescription>
        <div class="mt-2 flex justify-end gap-2">
          <AlertDialogCancel
            :class="
              cn(
                'inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-4 text-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100',
              )
            "
          >
            {{ cancelText }}
          </AlertDialogCancel>
          <AlertDialogAction
            :class="
              cn(
                'inline-flex h-9 items-center rounded-md px-4 text-sm text-white',
                destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:opacity-90',
                confirmLoading && 'pointer-events-none opacity-70',
              )
            "
            @click="onConfirm"
          >
            <span
              v-if="confirmLoading"
              class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
            {{ confirmText }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
