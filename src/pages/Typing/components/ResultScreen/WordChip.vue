<script setup lang="ts">
import AppTooltip from '@/components/ui/AppTooltip.vue'
import { playWordDirect } from '@/composables/usePronunciation'
import type { WordWithIndex } from '@/types'

// 平移自原项目 WordChip：错词墙 chip（hover 释义 tooltip + 点击发音）
// GlareHover 扫光（04 特效规划 P1）
const props = defineProps<{ word: WordWithIndex }>()

function onClickWord() {
  playWordDirect(props.word.name)
}
</script>

<template>
  <AppTooltip :content="props.word.trans.join('；')" placement="bottom">
    <button class="word-chip select-all" type="button" :title="`朗读 ${props.word.name}`" @click="onClickWord">
      <span>{{ props.word.name }}</span>
    </button>
  </AppTooltip>
</template>
