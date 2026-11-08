<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Popover, PopoverButton, PopoverPanel, TransitionRoot } from '@headlessui/vue'
import IconEyeSlash from '~icons/heroicons/eye-slash-solid'
import IconEye from '~icons/heroicons/eye-solid'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useConfigStore } from '@/stores/config'
import { useHotkeys } from '@/composables/useHotkeys'
import type { WordDictationType } from '@/types'

// 平移自原项目 WordDictationSwitcher：默写开关 + 4 种类型（openBy:'user' 语义保留）+ Ctrl+V
const config = useConfigStore()

const wordDictationTypeList: { name: string; type: WordDictationType }[] = [
  { name: '全部隐藏', type: 'hideAll' },
  { name: '隐藏元音', type: 'hideVowel' },
  { name: '隐藏辅音', type: 'hideConsonant' },
  { name: '随机隐藏', type: 'randomHide' },
]

const currentType = ref(wordDictationTypeList[0])
watch(
  () => config.wordDictation.type,
  (type) => {
    currentType.value = wordDictationTypeList.find((item) => item.type === type) ?? wordDictationTypeList[0]
  },
  { immediate: true },
)

const isOpen = computed(() => config.wordDictation.isOpen)

function onToggleWordDictation(checked: boolean) {
  // 打开时记 openBy:'user'（进下一章保持）；关闭不变（原逻辑）
  if (checked) {
    config.wordDictation.isOpen = true
    config.wordDictation.openBy = 'user'
  } else {
    config.wordDictation.isOpen = false
  }
}

function onChangeType(v: string | { key: string; label: string }) {
  const key = typeof v === 'string' ? v : v.key
  config.wordDictation.type = key as WordDictationType
}

useHotkeys(
  'ctrl+v',
  () => onToggleWordDictation(!isOpen.value),
  { enableOnFormTags: true, preventDefault: true },
)
</script>

<template>
  <Popover v-slot="{ open }" class="relative">
    <PopoverButton
      class="flex items-center justify-center rounded p-[2px] text-lg outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white"
      :class="[config.wordDictation.isOpen ? 'text-indigo-500' : 'text-gray-500', open ? 'bg-indigo-500 text-white' : '']"
      type="button"
      aria-label="开关默写模式"
    >
      <IconEye v-if="config.wordDictation.isOpen" class="icon" />
      <IconEyeSlash v-else class="icon" />
    </PopoverButton>
    <Transition
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
            <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">开关默写模式</span>
            <div class="flex w-full flex-row items-center justify-between">
              <AppSwitch :model-value="isOpen" @update:model-value="onToggleWordDictation" />
              <span class="text-right text-xs font-normal leading-tight text-gray-600">{{ `默写已${isOpen ? '开启' : '关闭'}` }}</span>
            </div>
          </div>

          <TransitionRoot
            :show="isOpen"
            enter-active-class="transition-all duration-300 ease-in"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[300px] opacity-100"
            leave-active-class="transition-all duration-300 ease-out"
            leave-from-class="max-h-[300px] opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-if="isOpen" class="flex w-full flex-col items-start gap-2 py-0">
              <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">默写模式</span>
              <div class="w-full">
                <AppSelect
                  :model-value="{ key: currentType.type, label: currentType.name }"
                  :options="wordDictationTypeList.map((t) => ({ key: t.type, label: t.name }))"
                  @update:model-value="onChangeType"
                />
              </div>
            </div>
          </TransitionRoot>
        </div>
      </PopoverPanel>
    </Transition>
  </Popover>
</template>
