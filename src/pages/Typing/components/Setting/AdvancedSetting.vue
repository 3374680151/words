<script setup lang="ts">
import AppSwitch from '@/components/ui/AppSwitch.vue'
import { useConfigStore } from '@/stores/config'

// 平移自原项目 AdvancedSetting：5 个开关（即时生效）
const config = useConfigStore()
const styles = {
  tabContent: 'flex w-full select-none flex-col items-start justify-start gap-10 overflow-y-auto pb-40 pl-6 pr-9 pt-8',
  section: 'flex w-full flex-col items-start gap-4',
  sectionLabel: 'pb-0 text-xl font-medium text-gray-600',
  sectionDescription: '-mt-1 pl-4 text-left text-xs font-normal leading-tight text-gray-600',
  switchBlock: 'flex w-full flex-row items-center justify-between gap-2 py-0 pl-4',
}

const items = [
  {
    label: '章节乱序',
    desc: '开启后，每次练习章节中单词会随机排序。下一章节生效',
    get: () => config.randomConfig.isOpen,
    set: (v: boolean) => (config.randomConfig.isOpen = v),
    name: '随机',
  },
  {
    label: '练习时展示上一个/下一个单词',
    desc: '开启后，练习中会在上方展示上一个/下一个单词',
    get: () => config.isShowPrevAndNextWord,
    set: (v: boolean) => (config.isShowPrevAndNextWord = v),
    name: '展示单词',
  },
  {
    label: '是否忽略大小写',
    desc: '开启后，输入时不区分大小写，如输入“hello”和“Hello”都会被认为是正确的',
    get: () => config.isIgnoreCase,
    set: (v: boolean) => (config.isIgnoreCase = v),
    name: '忽略大小写',
  },
  {
    label: '是否允许选择文本',
    desc: '开启后，可以通过鼠标选择文本',
    get: () => config.isTextSelectable,
    set: (v: boolean) => (config.isTextSelectable = v),
    name: '选择文本',
  },
  {
    label: '是否允许默写模式下显示提示',
    desc: '开启后，可以通过鼠标 hover 单词显示正确答案',
    get: () => config.isShowAnswerOnHover,
    set: (v: boolean) => (config.isShowAnswerOnHover = v),
    name: '显示提示',
  },
]
</script>

<template>
  <div :class="styles.tabContent">
    <div v-for="item in items" :key="item.label" :class="styles.section">
      <span :class="styles.sectionLabel">{{ item.label }}</span>
      <span :class="styles.sectionDescription">{{ item.desc }}</span>
      <div :class="styles.switchBlock">
        <AppSwitch :model-value="item.get()" @update:model-value="item.set" />
        <span class="text-right text-xs font-normal leading-tight text-gray-600">{{ `${item.name}已${item.get() ? '开启' : '关闭'}` }}</span>
      </div>
    </div>
  </div>
</template>
