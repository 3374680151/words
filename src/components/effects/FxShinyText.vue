<script setup lang="ts">
import { computed } from 'vue'

// 移植自 vue-bits ShinyText（纯 CSS 文字扫光，零运行时）
// props 语义与原库一致：text / speed(秒) / disabled
const props = withDefaults(
  defineProps<{
    text?: string
    speed?: number
    disabled?: boolean
  }>(),
  { speed: 5 },
)

const style = computed(() => ({
  animationDuration: `${props.speed}s`,
  animationPlayState: props.disabled ? 'paused' : 'running',
}))
</script>

<template>
  <span class="fx-shiny-text" :class="{ 'fx-shiny-text--disabled': disabled }" :style="style">
    <slot>{{ text }}</slot>
  </span>
</template>

<style scoped>
.fx-shiny-text {
  color: #b5b5b5a4;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  display: inline-block;
  animation-name: fx-shine;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.fx-shiny-text--disabled {
  background: none;
  color: currentColor;
}

@keyframes fx-shine {
  0% {
    background-position: 100%;
  }
  100% {
    background-position: -100%;
  }
}

/* 亮色底：基础色加深保证可读性（扫光仍为白色高光）；深色底由下方 .dark 覆盖 */
.fx-shiny-text {
  color: #9ca3af;
}

/* 深色底：提高基础色可读性 */
:global(.dark) .fx-shiny-text {
  color: #ffffff66;
}
</style>
