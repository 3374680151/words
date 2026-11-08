<script setup lang="ts">
import { computed } from 'vue'
import { Popover, PopoverButton, PopoverPanel, TransitionRoot } from '@headlessui/vue'
import IconRepeat from '~icons/tabler/repeat'
import IconRepeatOff from '~icons/tabler/repeat-off'
import { useConfigStore } from '@/stores/config'
import type { LoopWordTimesOption } from '@/types'

// 平移自原项目 LoopWordSwitcher：循环次数 RadioGroup（1/3/5/8/∞）
const config = useConfigStore()

const loopOptions: LoopWordTimesOption[] = [1, 3, 5, 8, Number.MAX_SAFE_INTEGER]
const loopTimes = computed(() => config.loopWordConfig.times)

function onChangeLoopTimes(value: number) {
  config.loopWordConfig.times = value
}
</script>

<template>
  <Popover class="relative">
    <PopoverButton
      class="rounded p-[2px] text-lg hover:bg-indigo-400 hover:text-white focus:outline-none"
      :class="loopTimes === 1 ? 'text-gray-500' : 'text-indigo-500'"
      type="button"
      aria-label="选择单词的循环次数"
    >
      <div class="relative">
        <IconRepeatOff v-if="loopTimes === 1" />
        <template v-else>
          <IconRepeat />
          <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.7] transform font-mono text-xs font-bold">
            {{ loopTimes === Number.MAX_SAFE_INTEGER ? '' : loopTimes }}
          </span>
        </template>
      </div>
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
            <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">选择单词的循环次数</span>
            <div class="flex w-full flex-col gap-2.5">
              <div v-for="(value, index) in loopOptions" :key="index" class="flex w-full items-center gap-3">
                <input
                  :id="`r${index}`"
                  type="radio"
                  name="loop-times"
                  class="h-[18px] w-[18px] cursor-pointer accent-indigo-600"
                  :checked="loopTimes === value"
                  @change="onChangeLoopTimes(value)"
                />
                <label :for="`r${index}`" class="cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                  {{ value === Number.MAX_SAFE_INTEGER ? '无限循环' : `${value} 次` }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </PopoverPanel>
    </TransitionRoot>
  </Popover>
</template>
