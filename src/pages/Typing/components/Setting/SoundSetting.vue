<script setup lang="ts">
import { computed } from 'vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import IconCheck from '~icons/tabler/check'
import IconChevronDown from '~icons/tabler/chevron-down'
import IconEar from '~icons/tabler/ear'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import AppSlider from '@/components/ui/AppSlider.vue'
import { keySoundResources } from '@/resources/soundResource'
import { playKeySoundResource } from '@/composables/useHowl'
import { useConfigStore } from '@/stores/config'
import { toFixedNumber } from '@/utils'
import type { SoundResource } from '@/types'

// 平移自原项目 SoundSetting：单词发音/释义发音/按键音（试听）/效果音，全部即时生效
const config = useConfigStore()
const styles = {
  tabContent: 'flex w-full flex-col items-start justify-start gap-10 overflow-y-auto pb-40 pl-6 pr-9 pt-8',
  section: 'flex w-full flex-col items-start gap-4',
  sectionLabel: 'pb-0 text-xl font-medium text-gray-600',
  block: 'flex w-full flex-col items-start gap-2 py-0 pl-4',
  blockLabel: 'font-medium text-gray-600',
  switchBlock: 'flex w-full flex-row items-center justify-between gap-2 py-0 pl-4',
}

const keySoundOptions = keySoundResources.map((r) => ({ key: r.key, label: r.name }))
const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window

function onPlayKeySound(resource: SoundResource) {
  playKeySoundResource(resource)
}

const pronVolume = computed(() => Math.floor(config.pronunciation.volume * 100))
const transVolume = computed(() => Math.floor(config.pronunciation.transVolume * 100))
const keyVolume = computed(() => Math.floor(config.keySounds.volume * 100))
const hintVolume = computed(() => Math.floor(config.hintSounds.volume * 100))
</script>

<template>
  <div :class="styles.tabContent">
    <!-- 单词发音 -->
    <div :class="styles.section">
      <span :class="styles.sectionLabel">单词发音</span>
      <div :class="styles.switchBlock">
        <AppSwitch :model-value="config.pronunciation.isOpen" @update:model-value="(v: boolean) => (config.pronunciation.isOpen = v)" />
        <span class="text-right text-xs font-normal leading-tight text-gray-600">{{ `发音已${config.pronunciation.isOpen ? '开启' : '关闭'}` }}</span>
      </div>
      <div :class="styles.block">
        <span :class="styles.blockLabel">音量</span>
        <div class="flex h-5 w-full items-center justify-between">
          <AppSlider
            class="w-full"
            :model-value="pronVolume"
            :max="100"
            :step="10"
            :disabled="!config.pronunciation.isOpen"
            aria-label="单词发音音量"
            @update:model-value="(v: number) => (config.pronunciation.volume = v / 100)"
          />
          <span class="ml-4 w-10 text-xs font-normal text-gray-600">{{ pronVolume }}%</span>
        </div>
      </div>
      <div :class="styles.block">
        <span :class="styles.blockLabel">倍速</span>
        <div class="flex h-5 w-full items-center justify-between">
          <AppSlider
            class="w-full"
            :model-value="config.pronunciation.rate ?? 1"
            :max="4"
            :min="0.5"
            :step="0.1"
            :disabled="!config.pronunciation.isOpen"
            aria-label="单词发音倍速"
            @update:model-value="(v: number) => (config.pronunciation.rate = v)"
          />
          <span class="ml-4 w-10 text-xs font-normal text-gray-600">{{ toFixedNumber(config.pronunciation.rate, 2) }}</span>
        </div>
      </div>
    </div>

    <!-- 释义发音（仅支持时渲染） -->
    <div v-if="hasSpeechSynthesis" :class="styles.section">
      <span :class="styles.sectionLabel">释义发音</span>
      <div :class="styles.switchBlock">
        <AppSwitch :model-value="config.pronunciation.isTransRead" @update:model-value="(v: boolean) => (config.pronunciation.isTransRead = v)" />
        <span class="text-right text-xs font-normal leading-tight text-gray-600">{{ `发音已${config.pronunciation.isTransRead ? '开启' : '关闭'}` }}</span>
      </div>
      <div :class="styles.block">
        <span :class="styles.blockLabel">音量</span>
        <div class="flex h-5 w-full items-center justify-between">
          <AppSlider
            class="w-full"
            :model-value="transVolume"
            :max="100"
            :step="10"
            aria-label="释义发音音量"
            @update:model-value="(v: number) => (config.pronunciation.transVolume = v / 100)"
          />
          <span class="ml-4 w-10 text-xs font-normal text-gray-600">{{ transVolume }}%</span>
        </div>
      </div>
    </div>

    <!-- 按键音 -->
    <div :class="styles.section">
      <span :class="styles.sectionLabel">按键音</span>
      <div :class="styles.switchBlock">
        <AppSwitch :model-value="config.keySounds.isOpen" @update:model-value="(v: boolean) => (config.keySounds.isOpen = v)" />
        <span class="text-right text-xs font-normal leading-tight text-gray-600">{{ `发音已${config.keySounds.isOpen ? '开启' : '关闭'}` }}</span>
      </div>
      <div :class="styles.block">
        <span :class="styles.blockLabel">音量</span>
        <div class="flex h-5 w-full items-center justify-between">
          <AppSlider
            class="w-full"
            :model-value="keyVolume"
            :max="100"
            :min="1"
            :step="10"
            :disabled="!config.keySounds.isOpen"
            aria-label="按键音音量"
            @update:model-value="(v: number) => (config.keySounds.volume = v / 100)"
          />
          <span class="ml-4 w-10 text-xs font-normal text-gray-600">{{ keyVolume }}%</span>
        </div>
      </div>
      <div :class="styles.block">
        <span :class="styles.blockLabel">按键音效</span>
        <Popover class="relative">
          <PopoverButton class="listbox-button w-60">
            <span>{{ config.keySounds.resource.name }}</span>
            <span>
              <IconChevronDown class="focus:outline-none" />
            </span>
          </PopoverButton>
          <PopoverPanel class="listbox-options z-10 w-60">
            <div v-for="r in keySoundOptions" :key="r.key" class="group flex cursor-pointer items-center justify-between" @click="config.keySounds.resource = keySoundResources.find((x) => x.key === r.key)!">
              <span class="flex-1 py-2 pl-4">{{ r.label }}</span>
              <IconCheck v-if="config.keySounds.resource.key === r.key" class="listbox-options-icon focus:outline-none" />
              <IconEar
                class="mr-2 hidden cursor-pointer text-neutral-500 hover:text-indigo-400 group-hover:block dark:text-neutral-300"
                @click.stop="onPlayKeySound(keySoundResources.find((x) => x.key === r.key)!)"
              />
            </div>
          </PopoverPanel>
        </Popover>
      </div>
    </div>

    <!-- 效果音 -->
    <div :class="styles.section">
      <span :class="styles.sectionLabel">效果音</span>
      <div :class="styles.switchBlock">
        <AppSwitch :model-value="config.hintSounds.isOpen" @update:model-value="(v: boolean) => (config.hintSounds.isOpen = v)" />
        <span class="text-right text-xs font-normal leading-tight text-gray-600">{{ `发音已${config.hintSounds.isOpen ? '开启' : '关闭'}` }}</span>
      </div>
      <div :class="styles.block">
        <span :class="styles.blockLabel">音量</span>
        <div class="flex h-5 w-full items-center justify-between">
          <AppSlider
            class="w-full"
            :model-value="hintVolume"
            :max="100"
            :min="1"
            :step="10"
            :disabled="!config.hintSounds.isOpen"
            aria-label="效果音音量"
            @update:model-value="(v: number) => (config.hintSounds.volume = v / 100)"
          />
          <span class="ml-4 w-10 text-xs font-normal text-gray-600">{{ hintVolume }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
