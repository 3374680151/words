<script setup lang="ts">
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from 'reka-ui'

// 受控 Slider（原项目 .slider 自定义类逐字平移；shadcn-vue 标准结构）
// 注意：结构必须保持 track>range、thumb 两级，与 index.css 的 .slider 选择器匹配
withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    ariaLabel?: string
  }>(),
  { min: 0, max: 100, step: 1 },
)

const emit = defineEmits<{ 'update:modelValue': [v: number] }>()

function onUpdate(v: number[] | undefined) {
  if (v && v.length > 0) emit('update:modelValue', v[0])
}
</script>

<template>
  <SliderRoot
    :model-value="[modelValue]"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    class="slider"
    @update:model-value="onUpdate"
  >
    <SliderTrack class="relative h-[5px] flex-grow rounded-full bg-gray-200 dark:bg-gray-600">
      <SliderRange class="absolute h-full rounded-full bg-indigo-400" />
    </SliderTrack>
    <SliderThumb
      :aria-label="ariaLabel ?? '滑杆'"
      class="block h-4 w-4 cursor-pointer rounded-full border border-gray-200 bg-white drop-shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-gray-500"
    />
  </SliderRoot>
</template>
