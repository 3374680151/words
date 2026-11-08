<script setup lang="ts">
import { computed } from 'vue'
import codeFlag from '@/assets/flags/code.png'
import deFlag from '@/assets/flags/de.png'
import enFlag from '@/assets/flags/en.png'
import idFlag from '@/assets/flags/id.png'
import jpFlag from '@/assets/flags/ja.png'
import kkFlag from '@/assets/flags/kk.png'
import type { LanguageCategoryType } from '@/types'

// 平移自原项目 LanguageTabSwitcher：6 语言 Tab（选中 border-b-2 indigo）
const props = defineProps<{ modelValue: LanguageCategoryType }>()
const emit = defineEmits<{ 'update:modelValue': [v: LanguageCategoryType] }>()

const options = computed(() => [
  { id: 'en' as const, name: '英语', flag: enFlag },
  { id: 'ja' as const, name: '日语', flag: jpFlag },
  { id: 'de' as const, name: '德语', flag: deFlag },
  { id: 'kk' as const, name: '哈萨克语', flag: kkFlag },
  { id: 'id' as const, name: '印尼语', flag: idFlag },
  { id: 'code' as const, name: 'Code', flag: codeFlag },
])
</script>

<template>
  <div class="flex items-center space-x-4">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="cursor-pointer"
      @click="emit('update:modelValue', option.id)"
    >
      <div
        class="flex items-center border-b-2 px-2 pb-1"
        :class="props.modelValue === option.id ? 'border-indigo-500' : 'border-transparent'"
      >
        <img :src="option.flag" class="mr-1.5 h-7 w-7" alt="" />
        <p class="text-lg font-medium text-gray-700 dark:text-gray-200">{{ option.name }}</p>
      </div>
    </button>
  </div>
</template>
