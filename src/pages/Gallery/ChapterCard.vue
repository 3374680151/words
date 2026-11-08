<script setup lang="ts">
import { ref, watch } from 'vue'
import IconCheckCircle from '~icons/heroicons/check-circle-solid'
import { useChapterStats } from './hooks/useGalleryData'

// 平移自原项目 Chapter：章节卡（IntersectionObserver 懒查 DB + 当前章自动滚动）
const props = defineProps<{
  index: number
  checked: boolean
  dictID: string
}>()

const emit = defineEmits<{ change: [index: number] }>()

const cardRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

// IntersectionObserver（VueUse 同名 composable 语义，手写轻量版）
let observer: IntersectionObserver | null = null
watch(
  cardRef,
  (el) => {
    observer?.disconnect()
    if (!el) return
    observer = new IntersectionObserver((entries) => {
      isVisible.value = entries.some((e) => e.isIntersecting)
    })
    observer.observe(el)
  },
  { immediate: true },
)

const chapterStatus = useChapterStats(props.index, props.dictID, isVisible)

// 当前章自动滚动（原行为：offsetTop - 容器 offsetTop - 300，smooth）
watch(
  () => props.checked,
  (checked) => {
    if (checked && cardRef.value) {
      const button = cardRef.value
      const container = button.parentElement?.parentElement?.parentElement
      container?.scroll({
        top: button.offsetTop - container.offsetTop - 300,
        behavior: 'smooth',
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    ref="cardRef"
    class="relative flex h-16 w-40 cursor-pointer flex-col items-start justify-center overflow-hidden rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800"
    @click="emit('change', props.index)"
  >
    <h1>第 {{ props.index + 1 }} 章</h1>
    <p class="pt-[2px] text-xs text-slate-600">
      {{ chapterStatus ? (chapterStatus.exerciseCount > 0 ? `练习 ${chapterStatus.exerciseCount} 次` : '未练习') : '加载中...' }}
    </p>
    <IconCheckCircle
      v-if="props.checked"
      class="absolute -bottom-4 -right-4 h-18 w-18 text-6xl text-green-500 opacity-40 dark:text-green-300"
    />
  </div>
</template>
