<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/ui'

// 移植自 vue-bits GlareHover（纯 CSS hover 扫光）
const props = withDefaults(
  defineProps<{
    class?: string
    glareWidth?: number
    duration?: number
    glareColor?: string
  }>(),
  { glareWidth: 60, duration: 800, glareColor: 'rgba(99, 102, 241, 0.35)' },
)

const lineStyle = computed(() => ({
  '--fx-glare-w': `${props.glareWidth}%`,
  '--fx-glare-duration': `${props.duration}ms`,
  '--fx-glare-color': props.glareColor,
}))
</script>

<template>
  <div class="fx-glare-hover" :class="cn($props.class)" :style="lineStyle">
    <slot />
    <span class="fx-glare-hover__line" aria-hidden="true" />
  </div>
</template>

<style scoped>
.fx-glare-hover {
  position: relative;
  overflow: hidden;
}

.fx-glare-hover__line {
  position: absolute;
  top: 0;
  left: calc(-1 * var(--fx-glare-w) - 100%);
  width: var(--fx-glare-w);
  height: 100%;
  transform: skewX(-20deg);
  background: linear-gradient(to right, transparent, var(--fx-glare-color), transparent);
  pointer-events: none;
  transition: none;
}

@media (hover: hover) {
  .fx-glare-hover:hover .fx-glare-hover__line {
    animation: fx-glare-sweep var(--fx-glare-duration) ease-out forwards;
  }
}

@keyframes fx-glare-sweep {
  from {
    left: calc(-1 * var(--fx-glare-w) - 20%);
  }
  to {
    left: 120%;
  }
}
</style>
