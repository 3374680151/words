<script setup lang="ts">
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/utils/ui'
import { watch, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/ui'

defineOptions({ inheritAttrs: false })

// 平移自原项目 ui/dialog.tsx：居中内容、zoom+fade+slide 动画、右上 X、persistent 支持点遮罩不关
const props = withDefaults(
  defineProps<{
    open?: boolean
    persistent?: boolean
    contentClass?: string
    title?: string
    description?: string
  }>(),
  {},
)

const emit = defineEmits<{ 'update:open': [v: boolean] }>()

// P0-H：Dialog 打开计数接线（修复原项目「Dialog 打开时 Enter/Esc 冒泡误触页面返回」）
const ui = useUiStore()
const dialogId = ui.nextDialogId()
watch(
  () => props.open,
  (v, old) => {
    if (v && !old) ui.dialogMounted(dialogId)
    else if (!v && old) ui.dialogUnmounted(dialogId)
  },
)
onUnmounted(() => {
  if (props.open) ui.dialogUnmounted(dialogId)
})
</script>

<template>
  <DialogRoot :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogTrigger as-child v-if="$slots.default">
      <slot />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <DialogContent
        :class="
          cn(
            'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200',
            'dark:border-gray-700 dark:bg-gray-800',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            contentClass,
          )
        "
        v-bind="$attrs"
        @interact-outside="(e: Event) => { if (persistent) e.preventDefault() }"
        @escape-key-down="(e: KeyboardEvent) => { if (persistent) e.preventDefault() }"
      >
        <slot name="content">
          <DialogTitle v-if="title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</DialogTitle>
          <DialogDescription v-if="description" class="text-sm text-gray-500 dark:text-gray-400">{{ description }}</DialogDescription>
          <slot name="inner" />
        </slot>
        <DialogClose
          v-if="!persistent"
          class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">关闭</span>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
