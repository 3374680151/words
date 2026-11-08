<script setup lang="ts">
import { computed } from 'vue'
import { Popover, PopoverButton, PopoverPanel, TransitionRoot } from '@headlessui/vue'
import IconSpeakerWave from '~icons/heroicons/speaker-wave-solid'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import { useConfigStore } from '@/stores/config'

// 平移自原项目 SoundSwitcher：按键音/效果音开关面板（样式类逐字平移）
const config = useConfigStore()

const keyOpen = computed(() => config.keySounds.isOpen)
const hintOpen = computed(() => config.hintSounds.isOpen)
</script>

<template>
  <Popover v-slot="{ open }" class="relative">
    <PopoverButton
      class="flex items-center justify-center rounded p-[2px] text-lg text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white"
      :class="open ? 'bg-indigo-500 text-white' : ''"
      aria-label="音效设置"
      title="音效设置"
    >
      <IconSpeakerWave class="icon" />
    </PopoverButton>
    <TransitionRoot
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <PopoverPanel class="absolute left-1/2 z-10 mt-2 flex max-w-max -translate-x-1/2 px-4">
        <div class="shadow-upper box-border flex w-60 select-none flex-col items-center justify-center gap-4 rounded-xl bg-white p-4 drop-shadow dark:bg-gray-800">
          <div class="flex w-full flex-col items-start gap-2 py-0">
            <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">开关按键音</span>
            <div class="flex w-full flex-row items-center justify-between">
              <AppSwitch :model-value="keyOpen" @update:model-value="(v: boolean) => (config.keySounds.isOpen = v)" />
              <span class="text-right text-xs font-normal leading-tight text-gray-600">{{ `发音已${keyOpen ? '开启' : '关闭'}` }}</span>
            </div>
          </div>
          <div class="flex w-full flex-col items-start gap-2 py-0">
            <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">开关效果音</span>
            <div class="flex w-full flex-row items-center justify-between">
              <AppSwitch :model-value="hintOpen" @update:model-value="(v: boolean) => (config.hintSounds.isOpen = v)" />
              <span class="text-right text-xs font-normal leading-tight text-gray-600">{{ `发音已${hintOpen ? '开启' : '关闭'}` }}</span>
            </div>
          </div>
        </div>
      </PopoverPanel>
    </TransitionRoot>
  </Popover>
</template>
