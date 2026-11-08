<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

// headlessui Popover：与原项目 switcher 面板同款交互（点击开合、点击外部关闭）
defineProps<{
  panelClass?: string
}>()
</script>

<template>
  <Popover v-slot="{ open }" class="relative">
    <PopoverButton as="template">
      <slot name="button" :open="open" />
    </PopoverButton>
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <PopoverPanel class="absolute right-0 z-40 mt-2 w-72 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-800" :class="panelClass">
        <slot :open="open" />
      </PopoverPanel>
    </transition>
  </Popover>
</template>
