<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'

// 移植自 vue-bits BlurText（gsap 逐词 blur→清晰入场）
const props = withDefaults(
  defineProps<{
    text?: string
    delay?: number
    animateBy?: 'words' | 'chars'
    duration?: number
  }>(),
  { delay: 100, animateBy: 'words', duration: 0.8 },
)

const el = ref<HTMLElement | null>(null)
let tween: gsap.core.Tween | null = null

const source = computed(() => props.text ?? '')
const units = computed(() =>
  props.animateBy === 'words' ? source.value.split(' ') : Array.from(source.value),
)

onMounted(() => {
  const targets = el.value?.querySelectorAll('.fx-blur-text__unit')
  if (!targets || targets.length === 0) return
  tween = gsap.fromTo(
    targets,
    { filter: 'blur(10px)', opacity: 0, y: 5 },
    {
      filter: 'blur(0px)',
      opacity: 1,
      y: 0,
      duration: props.duration,
      delay: props.delay / 1000,
      ease: 'power1.out',
      stagger: 0.02,
    },
  )
})

onBeforeUnmount(() => tween?.kill())
</script>

<template>
  <p ref="el" class="fx-blur-text inline-block">
    <template v-for="(u, i) in units" :key="i">
      <span class="fx-blur-text__unit inline-block">{{ u }}</span>
      <span v-if="animateBy === 'words' && i < units.length - 1">&nbsp;</span>
    </template>
  </p>
</template>
