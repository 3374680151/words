<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/ui'

// 移植自 vue-bits SpotlightCard（鼠标跟随光斑，纯 CSS+pointer）
const props = withDefaults(
  defineProps<{
    class?: string
    spotlightColor?: string
    radius?: number
  }>(),
  { spotlightColor: 'rgba(99, 102, 241, 0.18)', radius: 200 },
)

const vars = computed(() => ({
  '--fx-spotlight-color': props.spotlightColor,
  '--fx-spotlight-radius': `${props.radius}px`,
}))

function onPointerMove(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--fx-spotlight-x', `${e.clientX - rect.left}px`)
  el.style.setProperty('--fx-spotlight-y', `${e.clientY - rect.top}px`)
}
</script>

<template>
  <div class="fx-spotlight-card" :class="cn($props.class)" :style="vars" @pointermove="onPointerMove">
    <slot />
    <span class="fx-spotlight-card__glow" aria-hidden="true" />
  </div>
</template>

<style scoped>
.fx-spotlight-card {
  position: relative;
  overflow: hidden;
}

.fx-spotlight-card__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 300ms ease;
  background: radial-gradient(
    var(--fx-spotlight-radius) circle at var(--fx-spotlight-x, 50%) var(--fx-spotlight-y, 50%),
    var(--fx-spotlight-color),
    transparent 70%
  );
}

@media (hover: hover) {
  .fx-spotlight-card:hover .fx-spotlight-card__glow {
    opacity: 1;
  }
}
</style>
