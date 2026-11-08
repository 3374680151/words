<script setup lang="ts">
import { computed } from 'vue'
import KeyEventHandler from './KeyEventHandler.vue'
import TextAreaHandler from './TextAreaHandler.vue'
import { useDictStore } from '@/stores/dict'

// 平移自原项目 InputHandler：按词书语言分发输入通道
const props = defineProps<{
  updateInput: (updateObj: { type: 'add' | 'delete' | 'composition'; value?: string; event?: Event }) => void
}>()

const dict = useDictStore()
const language = computed(() => dict.dictInfo.language)
const useKeyHandler = computed(() => ['en', 'de', 'romaji'].includes(language.value))
</script>

<template>
  <KeyEventHandler v-if="useKeyHandler" :update-input="props.updateInput" />
  <TextAreaHandler v-else :update-input="props.updateInput" />
</template>
