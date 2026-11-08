<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TransitionRoot } from '@headlessui/vue'
import IconX from '~icons/tabler/x'
import IexportWords from '~icons/icon-park-outline/excel'
import IconCoffee from '~icons/mdi/coffee'
import IconXiaoHongShu from '~icons/my-icons/xiaohongshu'
import IconGithub from '~icons/simple-icons/github'
import IconWechat from '~icons/simple-icons/wechat'
import RemarkRing from './RemarkRing.vue'
import ConclusionBar from './ConclusionBar.vue'
import WordChip from './WordChip.vue'
import ShareButton from '../ShareButton/index.vue'
import FxCountUp from '@/components/effects/FxCountUp.vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import { useTypingStore } from '@/stores/typing'
import { useDictStore } from '@/stores/dict'
import { useConfigStore } from '@/stores/config'
import { useUiStore, toastSuccess, toastError } from '@/stores/ui'
import { useHotkeys } from '@/composables/useHotkeys'

// 平移自原项目 ResultScreen/index.tsx：三环 + 错词墙 + 三档评语 + 按钮四件套 + 快捷键
// 特效挂点（04 规划）：三环数字 CountUp、错词墙 GlareHover（WordChip 内）、评语区 P1 BlurText
const typing = useTypingStore()
const dict = useDictStore()
const config = useConfigStore()
const ui = useUiStore()
const router = useRouter()

// 挂载即补算最终数据（原 useEffect tick(0)）
typing.tick(0)

const wrongWords = computed(() =>
  typing.state.chapterData.userInputLogs
    .filter((log) => log.wrongCount > 0)
    .map((log) => typing.state.chapterData.words[log.index])
    .filter((word) => word !== undefined),
)

const isLastChapter = computed(() => config.currentChapter >= dict.chapterCount - 1)
const isReviewMode = computed(() => dict.isReviewMode)

// 单词级正确率（口径红线 #12：与 timerData 的字母级区分）
const correctRate = computed(() => {
  const chapterLength = typing.state.chapterData.words.length
  const correctCount = chapterLength - wrongWords.value.length
  return Math.floor((correctCount / chapterLength) * 100)
})

const mistakeLevel = computed(() => {
  if (correctRate.value >= 85) return 0
  if (correctRate.value >= 70) return 1
  return 2
})

const timeString = computed(() => {
  const seconds = typing.state.timerData.time
  const minutes = Math.floor(seconds / 60)
  const minuteString = minutes < 10 ? '0' + minutes : minutes + ''
  const restSeconds = seconds % 60
  const secondString = restSeconds < 10 ? '0' + restSeconds : restSeconds + ''
  return `${minuteString}:${secondString}`
})

// —— 按钮行为（逐字平移；openBy:'auto' 默写进下一章自动关） ——
function closeAutoDictation() {
  if (config.wordDictation.isOpen && config.wordDictation.openBy === 'auto') {
    config.wordDictation.isOpen = false
  }
}

function repeatButtonHandler() {
  if (isReviewMode.value) return
  closeAutoDictation()
  typing.repeatChapter(config.randomConfig.isOpen)
}

function dictationButtonHandler() {
  if (isReviewMode.value) return
  config.wordDictation.isOpen = true
  config.wordDictation.openBy = 'auto'
  typing.repeatChapter(config.randomConfig.isOpen)
}

function nextButtonHandler() {
  if (isReviewMode.value) return
  closeAutoDictation()
  if (!isLastChapter.value) {
    config.currentChapter += 1
    typing.nextChapter()
  }
}

function exitButtonHandler() {
  if (isReviewMode.value) {
    config.currentChapter = 0
    dict.exitReview()
  } else {
    typing.repeatChapter(false)
  }
}

function onNavigateToGallery() {
  config.currentChapter = 0
  dict.exitReview()
  router.push('/gallery')
}

// 导出本章单词 xlsx
const exporting = ref(false)
async function exportWords() {
  exporting.value = true
  try {
    const { words, userInputLogs } = typing.state.chapterData
    const exportData = userInputLogs.map((log) => {
      const word = words[log.index]
      const wordName = word.name
      return {
        ...JSON.parse(JSON.stringify(word)),
        trans: word.trans.join(';'),
        correctCount: log.correctCount,
        wrongCount: log.wrongCount,
        wrongLetters: Object.entries(log.LetterMistakes)
          .map(([key, mistakes]) => `${wordName[Number(key)]}:${mistakes.length}`)
          .join(';'),
      }
    })
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFileXLSX(wb, `${dict.dictInfo.name}第${config.currentChapter + 1}章.xlsx`)
    toastSuccess('导出成功', { duration: 2000 })
  } catch (e) {
    toastError('导出失败，请重试')
    console.error(e)
  } finally {
    exporting.value = false
  }
}

// —— 快捷键（含防连点 200ms，P0-6） ——
let lastAction = 0
function guard(fn: () => void) {
  const now = Date.now()
  if (now - lastAction < 200) return
  lastAction = now
  fn()
}

useHotkeys('enter', () => guard(nextButtonHandler), { preventDefault: true })
// space 加 stopPropagation：Firefox 下 preventDefault 无法阻止滚动等默认行为冒泡（红线 22，原版同款修复）
useHotkeys('space', () => guard(repeatButtonHandler), { preventDefault: true, stopPropagation: true })
useHotkeys('shift+enter', () => guard(dictationButtonHandler), { preventDefault: true })
</script>

<template>
  <div class="fixed inset-0 z-30 overflow-y-auto">
    <div class="absolute inset-0 bg-gray-300 opacity-80 dark:bg-gray-600" />
    <TransitionRoot :show="true" enter="ease-in duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-out duration-100" leave-from="opacity-100" leave-to="opacity-0">
      <div class="flex h-screen items-center justify-center">
        <div class="my-card fixed flex w-[90vw] max-w-6xl flex-col overflow-hidden rounded-3xl bg-white pb-14 pl-10 pr-5 pt-10 shadow-lg dark:bg-gray-800 md:w-4/5 lg:w-3/5">
          <div class="text-center font-sans text-xl font-normal text-gray-900 dark:text-gray-400 md:text-2xl">
            {{ `${dict.dictInfo.name} ${isReviewMode ? '错题复习' : '第' + (config.currentChapter + 1) + '章'}` }}
          </div>
          <button class="absolute right-7 top-5" aria-label="退出结果页" @click="exitButtonHandler">
            <IconX class="text-gray-400" />
          </button>
          <div class="mt-10 flex flex-row gap-2 overflow-hidden">
            <div class="flex flex-shrink-0 flex-grow-0 flex-col gap-3 px-4 sm:px-1 md:px-2 lg:px-4">
              <RemarkRing :remark="`${typing.state.timerData.accuracy}%`" caption="正确率" :percentage="typing.state.timerData.accuracy">
                <template #remark><FxCountUp :to="typing.state.timerData.accuracy" suffix="%" :duration="0.8" /></template>
              </RemarkRing>
              <RemarkRing :remark="timeString" caption="章节耗时" />
              <RemarkRing :remark="typing.state.timerData.wpm + ''" caption="WPM">
                <template #remark><FxCountUp :to="typing.state.timerData.wpm" :duration="0.8" /></template>
              </RemarkRing>
            </div>
            <div class="z-10 ml-6 flex-1 overflow-visible rounded-xl bg-indigo-50 dark:bg-gray-700">
              <div class="customized-scrollbar z-20 ml-8 mr-1 flex h-80 flex-row flex-wrap content-start gap-4 overflow-y-auto overflow-x-hidden pr-7 pt-9">
                <WordChip v-for="(word, index) in wrongWords" :key="`${index}-${word.name}`" :word="word" />
              </div>
              <div class="align-center flex w-full flex-row justify-start rounded-b-xl bg-indigo-200 px-4 dark:bg-indigo-400">
                <ConclusionBar :mistake-level="mistakeLevel" :mistake-count="wrongWords.length" />
              </div>
            </div>
            <div class="ml-2 flex flex-col items-center justify-end gap-3 text-xl">
              <!-- 作者头像（P2） -->
              <template v-if="!isReviewMode">
                <ShareButton />
                <IexportWords
                  class="cursor-pointer text-gray-500 hover:text-indigo-500"
                  :class="exporting && 'opacity-50 pointer-events-none'"
                  style="font-size: 18px"
                  aria-label="导出本章单词"
                  @click="exportWords"
                />
              </template>
              <IconXiaoHongShu
                style="font-size: 15px"
                class="cursor-pointer text-gray-500 hover:text-red-500 focus:outline-none"
                @click="ui.openInfoPanel('redBook')"
              />
              <button type="button" title="捐赠我们的项目" class="cursor-pointer" @click="ui.openInfoPanel('donate')">
                <IconCoffee style="font-size: 17px" class="text-gray-500 hover:text-amber-500 focus:outline-none" />
              </button>
              <button type="button" title="加入我们的社区" class="cursor-pointer text-gray-500 dark:text-gray-400" @click="ui.openInfoPanel('community')">
                <IconWechat style="font-size: 16px" class="text-gray-500 hover:text-green-500 focus:outline-none" />
              </button>
              <a href="https://github.com/RealKai42/qwerty-learner" target="_blank" rel="noreferrer" class="leading-[0px]">
                <IconGithub style="font-size: 16px" class="text-gray-500 hover:text-green-800 focus:outline-none" />
              </a>
            </div>
          </div>
          <div class="mt-10 flex w-full justify-center gap-5 px-5 text-xl">
            <template v-if="!isReviewMode">
              <AppTooltip content="快捷键：shift + enter">
                <button
                  class="my-btn-primary h-12 border-2 border-solid border-gray-300 bg-white text-base text-gray-700 dark:border-gray-700 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
                  type="button"
                  title="默写本章节"
                  @click="guard(dictationButtonHandler)"
                >
                  默写本章节
                </button>
              </AppTooltip>
              <AppTooltip content="快捷键：space">
                <button
                  class="my-btn-primary h-12 border-2 border-solid border-gray-300 bg-white text-base text-gray-700 dark:border-gray-700 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
                  type="button"
                  title="重复本章节"
                  @click="guard(repeatButtonHandler)"
                >
                  重复本章节
                </button>
              </AppTooltip>
            </template>
            <AppTooltip v-if="!isLastChapter && !isReviewMode" content="快捷键：enter">
              <button class="my-btn-primary h-12 text-base font-bold" type="button" title="下一章节" @click="guard(nextButtonHandler)">
                下一章节
              </button>
            </AppTooltip>
            <button v-if="isReviewMode" class="my-btn-primary h-12 text-base font-bold" type="button" title="练习其他章节" @click="onNavigateToGallery">
              练习其他章节
            </button>
          </div>
        </div>
      </div>
    </TransitionRoot>
  </div>
</template>
