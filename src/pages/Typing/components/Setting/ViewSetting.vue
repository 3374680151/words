<script setup lang="ts">
import AppSlider from '@/components/ui/AppSlider.vue'
import { defaultFontSizeConfig } from '@/constants'
import { useConfigStore } from '@/stores/config'

// 平移自原项目 ViewSetting：外语/中文字体滑杆（受控）+ 重置按钮
const config = useConfigStore()
const styles = {
  tabContent: 'flex w-full select-none flex-col items-start justify-start gap-10 overflow-y-auto pb-40 pl-6 pr-9 pt-8',
  section: 'flex w-full flex-col items-start gap-4',
  sectionLabel: 'pb-0 text-xl font-medium text-gray-600',
  sectionDescription: '-mt-1 pl-4 text-left text-xs font-normal leading-tight text-gray-600',
  block: 'flex w-full flex-col items-start gap-2 py-0 pl-4',
  blockLabel: 'font-medium text-gray-600',
}

function resetFontSize() {
  config.fontSize.foreignFont = defaultFontSizeConfig.foreignFont
  config.fontSize.translateFont = defaultFontSizeConfig.translateFont
}
</script>

<template>
  <div :class="styles.tabContent">
    <div :class="styles.section">
      <span :class="styles.sectionLabel">外语字体大小</span>
      <span :class="styles.sectionDescription">调整外语单词的大小，默认为 48px</span>
      <div :class="styles.block">
        <span :class="styles.blockLabel">字体大小</span>
        <div class="flex h-5 w-full items-center justify-between">
          <AppSlider
            class="w-full"
            :model-value="config.fontSize.foreignFont"
            :min="20"
            :max="96"
            :step="4"
            aria-label="外语字体大小"
            @update:model-value="(v: number) => (config.fontSize.foreignFont = v)"
          />
          <span class="ml-4 w-10 text-xs font-normal text-gray-600">{{ config.fontSize.foreignFont }}px</span>
        </div>
      </div>
    </div>
    <div :class="styles.section">
      <span :class="styles.sectionLabel">中文字体大小</span>
      <span :class="styles.sectionDescription">调整中文释义的大小，默认为 18px</span>
      <div :class="styles.block">
        <span :class="styles.blockLabel">字体大小</span>
        <div class="flex h-5 w-full items-center justify-between">
          <AppSlider
            class="w-full"
            :model-value="config.fontSize.translateFont"
            :min="14"
            :max="60"
            :step="4"
            aria-label="中文字体大小"
            @update:model-value="(v: number) => (config.fontSize.translateFont = v)"
          />
          <span class="ml-4 w-10 text-xs font-normal text-gray-600">{{ config.fontSize.translateFont }}px</span>
        </div>
      </div>
    </div>
    <button type="button" class="my-btn-primary ml-4" @click="resetFontSize">恢复默认</button>
  </div>
</template>
