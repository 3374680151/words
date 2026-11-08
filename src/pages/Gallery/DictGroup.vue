<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DictionaryCard from './DictionaryCard.vue'
import { findCommonValues } from '@/utils'
import type { Dictionary } from '@/types'

// 平移自原项目 CategoryDicts：tag 药丸切换 + 词书卡 grid + 自动定位当前词书 tag
const props = defineProps<{ groupedDictsByTag: Record<string, Dictionary[]>; currentDictTags: string[] }>()

const tagList = computed(() => Object.keys(props.groupedDictsByTag))
const currentTag = ref(tagList.value.length > 0 ? tagList.value[0] : '')

// 自动定位：当前词书 tags 与本组 tag 有交集 → 切到该 tag（原行为）
watch(
  [tagList, () => props.currentDictTags],
  () => {
    const commonTags = findCommonValues(tagList.value, props.currentDictTags)
    if (commonTags.length > 0) {
      currentTag.value = commonTags[0]
    }
  },
  { immediate: true },
)

const visibleDicts = computed(() => (currentTag.value && props.groupedDictsByTag[currentTag.value] ? props.groupedDictsByTag[currentTag.value] : []))
</script>

<template>
  <div>
    <div class="flex items-center space-x-4">
      <button
        v-for="tag in tagList"
        :key="tag"
        type="button"
        class="rounded-full px-3 py-1 text-sm"
        :class="currentTag === tag ? 'bg-indigo-400 text-white' : 'text-gray-600 hover:bg-indigo-100 dark:text-gray-300 dark:hover:bg-gray-700'"
        @click="currentTag = tag"
      >
        {{ tag }}
      </button>
    </div>
    <div class="mt-8 grid gap-x-5 gap-y-10 px-1 pb-4 sm:grid-cols-1 md:grid-cols-2 dic3:grid-cols-3 dic4:grid-cols-4">
      <template v-if="visibleDicts.length > 0">
        <DictionaryCard v-for="dict in visibleDicts" :key="dict.id" :dictionary="dict" />
      </template>
      <div v-else class="col-span-full text-center text-gray-500">当前分类下没有可用的词典</div>
    </div>
  </div>
</template>
