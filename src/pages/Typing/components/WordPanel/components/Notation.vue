<script setup lang="ts">
import { computed } from 'vue'

// 注音渲染（romaji/hapin 词书 notation 字段）：`漢字(かんじ)かな` → ruby 注音附着到括号前文本
type NotationInfo = { word: string; phonetic?: string }

const props = defineProps<{ notation: string }>()

const infos = computed<NotationInfo[]>(() => {
  const result: NotationInfo[] = []
  const regex = /([^()]+)\(([^()]*)\)/g
  let match: RegExpExecArray | null
  let lastEnd = 0
  while ((match = regex.exec(props.notation)) !== null) {
    for (const ch of match[1]) result.push({ word: ch })
    if (result.length > 0) result[result.length - 1].phonetic = match[2]
    lastEnd = regex.lastIndex
  }
  for (const ch of props.notation.slice(lastEnd)) result.push({ word: ch })
  return result
})
</script>

<template>
  <div class="mx-auto flex h-20 items-end">
    <ruby class="mb-1 p-0 font-mono text-5xl text-gray-800 dark:text-opacity-80">
      <template v-for="(info, i) in infos" :key="i">
        <span>{{ info.word }}</span>
        <template v-if="info.phonetic !== undefined">
          <rp>(</rp>
          <rt>{{ info.phonetic }}</rt>
          <rp>)</rp>
        </template>
      </template>
    </ruby>
  </div>
</template>
