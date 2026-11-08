<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'

// headlessui/vue Listbox：与原项目 .listbox-button/.listbox-options 类逐字一致
export interface SelectOption {
  key: string
  label: string
}

defineProps<{
  modelValue: SelectOption | string
  options: SelectOption[]
  buttonClass?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [v: SelectOption | string] }>()

function keyOf(v: SelectOption | string) {
  return typeof v === 'string' ? v : v.key
}
function matchOption(list: SelectOption[], value: SelectOption | string): SelectOption {
  const k = keyOf(value)
  return list.find((o) => o.key === k) ?? list[0]
}
</script>

<template>
  <Listbox
    :model-value="typeof modelValue === 'string' ? options.find((o) => o.key === modelValue) : modelValue"
    by="key"
    @update:model-value="(v: SelectOption) => emit('update:modelValue', v)"
  >
    <div class="relative">
      <ListboxButton class="listbox-button" :class="buttonClass">
        <span class="block truncate">{{ matchOption(options, modelValue)?.label }}</span>
        <span>
          <ChevronsUpDown class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>
      <transition
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions class="listbox-options z-50">
          <ListboxOption v-for="opt in options" :key="opt.key" :value="opt" as="li" v-slot="{ selected }">
            <span class="block truncate">{{ opt.label }}</span>
            <span v-if="selected" class="listbox-options-icon">
              <Check class="h-5 w-5" aria-hidden="true" />
            </span>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>
