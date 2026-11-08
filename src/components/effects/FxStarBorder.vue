<script setup lang="ts">
import { computed } from 'vue'

// 移植自 vue-bits StarBorder（纯 CSS 流光描边）
// 本项目默认色替换为 indigo 系（亮 #6366f1 / 暗 #818cf8）
const props = withDefaults(
  defineProps<{
    speed?: string
    thickness?: number
    color?: string
    color2?: string
  }>(),
  { speed: '6s', thickness: 1, color: '#6366f1', color2: '#818cf8' },
)

const outerStyle = computed(() => ({ padding: `${props.thickness}px 0` }))
const durationStyle = computed(() => ({ '--fx-star-duration': props.speed }))
</script>

<template>
  <div class="fx-star-border" :style="outerStyle">
    <div class="fx-star-border__bg" :style="durationStyle">
      <div class="fx-star-border__line fx-star-border__line--top" />
      <div class="fx-star-border__line fx-star-border__line--bottom" />
    </div>
    <div class="fx-star-border__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.fx-star-border {
  position: relative;
  display: inline-block;
  overflow: hidden;
  border-radius: 12px;
  isolation: isolate;
}

.fx-star-border__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  z-index: 0;
  background: transparent;
}

.fx-star-border__line {
  position: absolute;
  left: -100%;
  width: 300%;
  height: 2px;
  opacity: 0.9;
  pointer-events: none;
}

.fx-star-border__line--top {
  top: 0;
  background: linear-gradient(to right, transparent, v-bind('color'), transparent);
  animation: fx-star-top var(--fx-star-duration, 6s) linear infinite;
}

.fx-star-border__line--bottom {
  bottom: 0;
  background: linear-gradient(to right, transparent, v-bind('color2'), transparent);
  animation: fx-star-bottom var(--fx-star-duration, 6s) linear infinite;
}

.fx-star-border__content {
  position: relative;
  z-index: 1;
}

@keyframes fx-star-top {
  0% {
    transform: translateX(33.33%);
  }
  100% {
    transform: translateX(-33.33%);
  }
}

@keyframes fx-star-bottom {
  0% {
    transform: translateX(-33.33%);
  }
  100% {
    transform: translateX(33.33%);
  }
}
</style>
