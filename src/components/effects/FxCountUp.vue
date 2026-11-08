<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'

// 移植自 vue-bits CountUp（gsap 数字滚动）
// 本项目扩展：in-view 触发（IntersectionObserver），用于统计页
const props = withDefaults(
  defineProps<{
    to: number
    from?: number
    duration?: number
    delay?: number
    separator?: string
    decimals?: number
    suffix?: string
    prefix?: string
    trigger?: 'mount' | 'in-view'
  }>(),
  { from: 0, duration: 1, delay: 0, separator: '', decimals: 0, trigger: 'mount' },
)

const el = ref<HTMLElement | null>(null)
const display = ref(format(props.from))
let tween: gsap.core.Tween | null = null
let observer: IntersectionObserver | null = null
let played = false

function format(v: number) {
  const fixed = props.decimals > 0 ? v.toFixed(props.decimals) : String(Math.round(v))
  const [int, dec] = fixed.split('.')
  const grouped = props.separator ? int.replace(/\B(?=(\d{3})+(?!\d))/g, props.separator) : int
  return `${props.prefix ?? ''}${grouped}${dec ? '.' + dec : ''}${props.suffix ?? ''}`
}

function play() {
  if (played) return
  played = true
  const proxy = { v: props.from }
  tween = gsap.fromTo(
    proxy,
    { v: props.from },
    {
      v: props.to,
      duration: props.duration,
      delay: props.delay,
      ease: 'power2.out',
      onUpdate: () => {
        display.value = format(proxy.v)
      },
    },
  )
}

onMounted(() => {
  if (props.trigger === 'mount') {
    play()
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        play()
        observer?.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  if (el.value) observer.observe(el.value)
})

onBeforeUnmount(() => {
  tween?.kill()
  observer?.disconnect()
})

// 重打章节等场景：数值变化时重新滚动
watch(
  () => props.to,
  () => {
    played = false
    play()
  },
)
</script>

<template>
  <span ref="el">{{ display }}</span>
</template>
