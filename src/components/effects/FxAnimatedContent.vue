<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'

// 移植自 vue-bits AnimatedContent（gsap 入场：位移 + 透明度 + blur）
// 本项目扩展：trigger = 'mount' | 'in-view'（原库为 ScrollTrigger，此处用 IntersectionObserver 等价替换）
const props = withDefaults(
  defineProps<{
    direction?: 'vertical' | 'horizontal'
    distance?: number
    duration?: number
    delay?: number
    blur?: string
    trigger?: 'mount' | 'in-view'
    staggerChildren?: boolean
  }>(),
  { direction: 'vertical', distance: 20, duration: 0.8, delay: 0, blur: '10px', trigger: 'mount' },
)

const el = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let tween: gsap.core.Tween | null = null
let played = false

function play() {
  if (played || !el.value) return
  played = true
  const from: gsap.TweenVars = { opacity: 0, filter: `blur(${props.blur})` }
  const to: gsap.TweenVars = { opacity: 1, filter: 'blur(0px)', duration: props.duration, delay: props.delay, ease: 'power3.out' }
  if (props.direction === 'vertical') {
    from.y = props.distance
    to.y = 0
  } else {
    from.x = props.distance
    to.x = 0
  }
  tween = gsap.fromTo(el.value, from, to)
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
    { threshold: 0.15 },
  )
  if (el.value) observer.observe(el.value)
})

onBeforeUnmount(() => {
  tween?.kill()
  observer?.disconnect()
})
</script>

<template>
  <div ref="el" class="fx-animated-content">
    <slot />
  </div>
</template>
