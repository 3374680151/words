<script setup lang="ts">
import { computed, watch } from 'vue'
import { Popover, PopoverButton, PopoverPanel, TransitionRoot } from '@headlessui/vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { LANG_PRON_MAP } from '@/resources/soundResource'
import { PRONUNCIATION_PHONETIC_MAP } from '@/types'
import { useConfigStore } from '@/stores/config'
import { useDictStore } from '@/stores/dict'
import { CTRL } from '@/utils'

// 平移自原项目 PronunciationSwitcher：4 开关 + 口音 Listbox
// 联动：切词书时口音不在列表 → 重置为词典默认；口音变化 → 音标类型联动
const config = useConfigStore()
const dict = useDictStore()

const pronunciationList = computed(() => LANG_PRON_MAP[dict.dictInfo.language].pronunciation)

// 口音校验（原 useEffect 逻辑）
watch(
  [() => dict.dictInfo.language, () => dict.dictInfo.defaultPronIndex, pronunciationList],
  () => {
    const defaultPronIndex = dict.dictInfo.defaultPronIndex || LANG_PRON_MAP[dict.dictInfo.language].defaultPronIndex
    const defaultPron = pronunciationList.value[defaultPronIndex]
    const index = pronunciationList.value.findIndex((item) => item.pron === config.pronunciation.type)
    if (index === -1 && defaultPron) {
      config.pronunciation.type = defaultPron.pron
      config.pronunciation.name = defaultPron.name
    }
  },
  { immediate: true },
)

// 口音变化 → 音标联动（原 useEffect 逻辑）
watch(
  () => config.pronunciation.type,
  (type) => {
    const phoneticType = PRONUNCIATION_PHONETIC_MAP[type]
    if (phoneticType) {
      config.phonetic.type = phoneticType
    }
  },
  { immediate: true },
)

const currentLabel = computed(() => (config.pronunciation.isOpen ? config.pronunciation.name : '关闭'))
const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window

function onChangeType(v: string | { key: string; label: string }) {
  const key = typeof v === 'string' ? v : v.key
  const item = pronunciationList.value.find((i) => i.pron === key)
  if (item) {
    config.pronunciation.type = item.pron
    config.pronunciation.name = item.name
  }
}
</script>

<template>
  <Popover v-slot="{ open }" class="relative">
    <PopoverButton
      class="flex h-8 min-w-max cursor-pointer items-center justify-center rounded-md px-1 transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
      :class="open ? 'bg-indigo-400 text-white' : 'bg-transparent'"
    >
      <AppTooltip content="发音及音标切换">{{ currentLabel }}</AppTooltip>
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
            <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">音标显示</span>
            <div class="flex w-full flex-row items-center justify-between">
              <AppSwitch :model-value="config.phonetic.isOpen" @update:model-value="(v: boolean) => (config.phonetic.isOpen = v)" />
            </div>
          </div>
          <div class="flex w-full flex-col items-start gap-2 py-0">
            <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">单词发音</span>
            <div class="flex w-full flex-row items-center justify-between">
              <AppSwitch :model-value="config.pronunciation.isOpen" @update:model-value="(v: boolean) => (config.pronunciation.isOpen = v)" />
            </div>
          </div>
          <div v-if="hasSpeechSynthesis" class="flex w-full flex-col items-start gap-2 py-0">
            <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">释义发音</span>
            <div class="flex w-full flex-row items-center justify-between">
              <AppSwitch :model-value="config.pronunciation.isTransRead" @update:model-value="(v: boolean) => (config.pronunciation.isTransRead = v)" />
            </div>
          </div>
          <div class="flex w-full flex-col items-start gap-2 py-0">
            <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">循环发音</span>
            <div class="flex w-full flex-row items-center justify-between">
              <AppSwitch :model-value="config.pronunciation.isLoop" @update:model-value="(v: boolean) => (config.pronunciation.isLoop = v)" />
            </div>
          </div>
          <div class="flex w-full flex-col items-start gap-2 py-0">
            <span class="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">发音口音</span>
            <div class="w-full">
              <AppSelect
                :model-value="{ key: config.pronunciation.type, label: config.pronunciation.name }"
                :options="pronunciationList.map((p) => ({ key: p.pron as string, label: p.name }))"
                @update:model-value="onChangeType"
              />
            </div>
            <p class="text-xs text-gray-400">快捷键 {{ CTRL }} + J 朗读当前单词</p>
          </div>
        </div>
      </PopoverPanel>
    </TransitionRoot>
  </Popover>
</template>
