<script setup lang="ts">
import { ref, computed } from 'vue'
import { TransitionRoot, TransitionChild, Dialog, DialogPanel } from '@headlessui/vue'
import IconXMark from '~icons/heroicons/x-mark-solid'
import IconShare2 from '~icons/tabler/share-2'
import { useTypingStore } from '@/stores/typing'
import { useDictStore } from '@/stores/dict'
import { useConfigStore } from '@/stores/config'
import shareImage1 from '@/assets/sharePic/image-1.png'
import shareImage2 from '@/assets/sharePic/image-2.png'
import shareImage3 from '@/assets/sharePic/image-3.png'
import shareImage4 from '@/assets/sharePic/image-4.png'
import shareImage5 from '@/assets/sharePic/image-5.png'
import shareImage6 from '@/assets/sharePic/image-6.png'
import shareImage7 from '@/assets/sharePic/image-7.png'
import shareImage8 from '@/assets/sharePic/image-8.png'
import shareImage9 from '@/assets/sharePic/image-9.png'
import keyboardSvg from '@/assets/sharePic/keyBackground.svg'

// 平移自原项目 ShareButton + SharePicDialog：成绩分享海报
// html-to-image 三倍清晰度；随机 1/9 插画 + 1/17 宣传语（useMemo 语义：挂载时定死）；海报容器禁动画（截图安全红线）
const PIC_RATIO = 3
const PIC_LIST = [shareImage1, shareImage2, shareImage3, shareImage4, shareImage5, shareImage6, shareImage7, shareImage8, shareImage9]
// 我知道有些有点怪，但怪的有趣(狗头)，powered by chatGPT（原注释保留）
const PROMOTE_LIST = [
  { word: '快人一手', sentence: '速度快得就像比别人多长了一只手' },
  { word: '手落听雨', sentence: '雷霆手法，震撼观众' },
  { word: '疾如闪电', sentence: '打字速度极快，就像一道闪电在键盘上迅速穿梭' },
  { word: '手如疾风', sentence: '手速快得惊人，就像疾风一般' },
  { word: '精准如箭', sentence: '打字精度极高，就像一箭命中靶心一般准确' },
  { word: '狂飙突进', sentence: '打字速度快得让人感到狂飙突进的冲劲' },
  { word: '神速如风', sentence: '神速打字，如同风一样快' },
  { word: '招招到位', sentence: '打字精度和速度都十分到位，毫不出错。' },
  { word: '如履平地', sentence: '打字手法熟练，如履平地，行云流水' },
  { word: '声东击西', sentence: '打字技巧高超，声东击西，出奇制胜' },
  { word: '魔法使者', sentence: '打字速度快得让人难以置信，就像一名魔法使者。' },
  { word: '灵活多变', sentence: '打字姿势灵活多变，就像一只蛇一样柔韧。' },
  { word: '犹如飞鸟', sentence: '打字速度极快，就像一只飞鸟在键盘上翱翔。' },
  { word: '连珠妙语', sentence: '打字技巧娴熟，如同一连串妙语连珠。' },
  { word: '百毒不侵', sentence: '打字速度和准确度都非常高，就像身具百毒不侵的能力。' },
  { word: '攻守兼备', sentence: '打字速度和精度都非常出色，攻守兼备，所向披靡。' },
  { word: '跃然纸上', sentence: '打字手法灵活多变，跃然纸上，生动有趣。' },
]

const typing = useTypingStore()
const dict = useDictStore()
const config = useConfigStore()

const isShowSharePanel = ref(false)
const imageURL = ref<string | null>(null)
const generating = ref(false)

// 随机数挂载时定死（原 useMemo 语义）
const picRandom = Math.random()
const promoteRandom = Math.random()
const shareImage = computed(() => PIC_LIST[Math.floor(picRandom * PIC_LIST.length)])
const promote = computed(() => PROMOTE_LIST[Math.floor(promoteRandom * PROMOTE_LIST.length)])

async function loadToPng() {
  generating.value = true
  imageURL.value = null
  try {
    const { toPng } = await import('html-to-image')
    if (imageRef.value) {
      const width = imageRef.value.offsetWidth
      const height = imageRef.value.offsetHeight
      imageURL.value = await toPng(imageRef.value, { canvasWidth: width * PIC_RATIO, canvasHeight: height * PIC_RATIO })
    }
  } catch (e) {
    console.error('海报生成失败', e)
  } finally {
    generating.value = false
  }
}

async function onClickShare() {
  isShowSharePanel.value = true
  await loadToPng()
}

async function handleDownload() {
  if (imageURL.value) {
    const { saveAs } = await import('file-saver')
    saveAs(imageURL.value, 'Qwerty-learner.png')
  }
}

const imageRef = ref<HTMLDivElement | null>(null)
</script>

<script lang="ts">
export default { name: 'ShareButton' }
</script>

<template>
  <button
    type="button"
    class="cursor-pointer text-xl text-gray-500 hover:text-indigo-400"
    title="分享你的成绩给朋友"
    aria-label="分享成绩"
    @click="onClickShare"
  >
    <IconShare2 />
  </button>

  <TransitionRoot :show="isShowSharePanel" as="template">
    <Dialog class="relative z-50" @close="isShowSharePanel = false">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all dark:bg-gray-700">
              <div class="flex flex-col items-center justify-center pb-10 pl-20 pr-14 pt-20">
                <button class="absolute right-7 top-5" type="button" title="关闭对话框" @click="isShowSharePanel = false">
                  <IconXMark class="h-6 w-6 text-gray-400" />
                </button>
                <div class="h-152 w-116">
                  <img v-if="imageURL" :src="imageURL" class="h-auto w-full" alt="分享海报" />
                  <div v-else class="flex h-full w-full items-center justify-center rounded-lg border-2 border-solid border-white">
                    <svg class="-ml-1 mr-3 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-50" cx="12" cy="12" r="10" stroke="rgb(129 140 248)" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                </div>
                <button class="my-btn-primary mr-9 mt-10 h-10" type="button" :disabled="!imageURL" title="保存" @click="handleDownload">保存</button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>

  <!-- 海报源（离屏渲染；纯静态无动画——截图安全红线） -->
  <div style="position: absolute; left: -9999px; zIndex: -1">
    <div ref="imageRef" class="box-content w-85 bg-white p-4">
      <div class="relative flex h-112 w-75 flex-col items-start justify-start rounded-xl shadow-lg" style="background-color: #f8f8ff">
        <div class="w-full">
          <div class="mt-10 flex flex-wrap justify-center gap-0">
            <div v-for="(char, index) in promote.word.split('')" :key="index" class="relative -mx-1 h-18 w-18">
              <div class="absolute inset-0"><img :src="keyboardSvg" class="h-full w-full" alt="" /></div>
              <div class="absolute left-0 right-0 top-2.5 flex items-center justify-center">
                <span class="text-base font-normal text-white" style="font-size: 20px; transform: rotateX(30deg)">{{ char }}</span>
              </div>
            </div>
          </div>
          <div class="text-center text-xs text-gray-500">{{ promote.sentence }}</div>
          <div class="mx-4 mt-6 flex rounded-xl bg-white px-4 py-3 opacity-50 shadow-xl">
            <div v-for="box in [
              { data: String(typing.state.timerData.time), description: '用时' },
              { data: typing.state.timerData.accuracy + '%', description: '正确率' },
              { data: String(typing.state.timerData.wpm), description: 'WPM' },
            ]" :key="box.description" class="flex w-20 flex-1 flex-col items-center justify-center">
              <span class="w-4/5 text-center text-base font-normal text-gray-600">{{ box.data }}</span>
              <span class="pt-2 text-xs text-gray-400">{{ box.description }}</span>
            </div>
          </div>
          <div class="ml-5 mt-4 self-start text-base text-gray-800">{{ dict.dictInfo.name }}</div>
          <div class="ml-5 mt-2 self-start text-xs text-gray-600">{{ `第 ${config.currentChapter + 1} 章` }}</div>
        </div>
        <div class="mb-3 ml-5 mt-auto">
          <div class="text-xs">Qwerty.kaiyi.cool</div>
          <div class="mt-1 text-xs font-normal text-gray-400">为键盘工作者设计的单词与肌肉记忆锻炼软件</div>
        </div>
        <div class="absolute -right-9 bottom-10">
          <img :src="shareImage" class="w-48" width="186" height="122" alt="" />
        </div>
      </div>
    </div>
  </div>
</template>
