<script setup lang="ts">
import { computed } from 'vue'
import { motionEnabled } from '@/composables/useMotionPrefs'

// 所有 L2 氛围特效的统一守卫：不满足 → 渲染静态降级内容
// 注意：Vue 对 Boolean 类型 prop 有"缺省转 false"行为（无显式 default 时），
// 必须用 withDefaults 提供显式 default 才能让缺省值为 true
const props = withDefaults(
  defineProps<{
    /** 额外开关（如 cursorFx），与全局 ambient 叠加判定 */
    when?: boolean
  }>(),
  { when: true },
)

const enabled = computed(() => motionEnabled.value && props.when)
</script>

<template>
  <template v-if="enabled">
    <slot />
  </template>
  <template v-else>
    <slot name="fallback" />
  </template>
</template>
