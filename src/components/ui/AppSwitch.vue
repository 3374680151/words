<script setup lang="ts">
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue'

// headlessui/vue Switch：与原项目同款实现，.switch-root/.switch-thumb 类逐字一致
defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()
</script>

<template>
  <SwitchGroup as="div" class="flex items-center gap-3">
    <Switch
      :model-value="modelValue"
      :disabled="disabled"
      class="switch-root"
      @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    >
      <span class="switch-thumb" />
    </Switch>
    <SwitchLabel v-if="label" class="cursor-pointer text-sm text-gray-700 dark:text-gray-300" passive>
      {{ label }}
    </SwitchLabel>
  </SwitchGroup>
</template>
