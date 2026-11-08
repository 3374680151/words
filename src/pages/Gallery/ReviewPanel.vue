<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MdiRobotAngry from '~icons/mdi/robot-angry'
import AppButton from '@/components/ui/Button.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import { useDictStore } from '@/stores/dict'
import { generateNewWordReviewRecord, getLatestReviewRecord } from '@/utils/db/review-record'
import { timeStamp2String } from '@/utils'
import type { ReviewRecord } from '@/utils/db/record'
import type { TErrorWordData } from '@/utils/db/review-record'
import type { Dictionary } from '@/types'

// 平移自原项目 ReviewDetail：智能复习（0.6/0.4 加权）+ 继续当前进度
// 🆕：生成/查询过程 loading 态（原版无）
const props = defineProps<{
  errorData: TErrorWordData[]
  dict: Dictionary
}>()

const router = useRouter()
const dictStore = useDictStore()

const latestReviewRecord = ref<ReviewRecord | undefined>(undefined)
const loading = ref(false)
const starting = ref(false)

let seq = 0
watch(
  () => props.dict.id,
  async () => {
    const mySeq = ++seq
    loading.value = true
    const record = await getLatestReviewRecord(props.dict.id)
    if (mySeq === seq) {
      latestReviewRecord.value = record
      loading.value = false
    }
  },
  { immediate: true },
)

async function startReview() {
  starting.value = true
  try {
    const record = await generateNewWordReviewRecord(props.dict.id, props.errorData)
    await dictStore.startReview(record)
    router.push('/')
  } finally {
    starting.value = false
  }
}

async function continueReview() {
  if (!latestReviewRecord.value) return
  await dictStore.startReview(latestReviewRecord.value)
  router.push('/')
}
</script>

<template>
  <div class="flex h-full flex-col items-center justify-around px-60">
    <div>
      <MdiRobotAngry class="text-indigo-300" style="font-size: 30px" />
      <blockquote>
        <p class="text-lg font-medium text-gray-600 dark:text-gray-300">
          我们将使用您在该词典的历史练习数据、错误次数、练习时间来智能生成练习列表
          <br />
          目前该生成方式还处于实验阶段，我们会逐步完善该生成方式
        </p>
      </blockquote>
    </div>
    <div class="flex w-full flex-col items-center">
      <div v-if="loading" class="text-sm text-gray-400">加载中...</div>
      <template v-else-if="latestReviewRecord">
        <div class="ml-10 flex w-full items-center py-0">
          <AppProgress
            class="mr-4 border border-indigo-400 bg-white"
            :value="latestReviewRecord.index + 1"
            :max="latestReviewRecord.words.length"
          />
          <span class="p-0 text-xs">{{ latestReviewRecord.index + 1 }}/{{ latestReviewRecord.words.length }}</span>
        </div>
        <div class="mt-1 text-sm font-normal text-gray-500">{{ `( 创建于 ${timeStamp2String(latestReviewRecord.createTime)} )` }}</div>
      </template>
      <div v-else-if="!loading">当前词典错词数: {{ props.errorData.length }}</div>

      <div class="mt-6 flex gap-10">
        <AppButton v-if="latestReviewRecord" size="sm" :loading="starting" @click="continueReview">继续当前进度</AppButton>
        <AppButton size="sm" :loading="starting" @click="startReview">开始{{ latestReviewRecord ? '新的' : '' }}复习</AppButton>
      </div>
    </div>
  </div>
</template>
