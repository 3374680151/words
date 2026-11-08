<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import Layout from '@/components/common/Layout.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import WordPanel from './components/WordPanel/index.vue'
import FxGate from '@/components/common/FxGate.vue'
import { useDictWords, useChapterGuard } from '@/composables/useDictWords'
import { useConfetti } from '@/composables/useConfetti'
import { useHotkeys } from '@/composables/useHotkeys'
import { useTypingStore } from '@/stores/typing'
import { useDictStore } from '@/stores/dict'
import { useConfigStore } from '@/stores/config'
import { saveChapterRecord } from '@/utils/db'
import { toastError, toastPersistent } from '@/stores/ui'
import { isLegal, IsDesktop } from '@/utils'
import PronunciationSwitcher from './components/PronunciationSwitcher.vue'
import Switcher from './components/Switcher.vue'
import WordListDrawer from './components/WordListDrawer.vue'
import SpeedBar from './components/SpeedBar.vue'
import ResultScreen from './components/ResultScreen/index.vue'
import DonateCard from '@/components/DonateCard/index.vue'


defineOptions({ name: 'typing-page' })

// 平移自原项目 pages/Typing/index.tsx（工单 2B 范围：输入核心 + 最小 Start/Skip/SpeedBar；2C/2D 补全）
const typing = useTypingStore()
const dict = useDictStore()
const config = useConfigStore()

const { words, isLoading, error, reload } = useDictWords()

// 章节越界守卫（修复原 render 期副作用）
watchEffect(() => {
  useChapterGuard()
})

// 词表就绪 → setupChapter（乱序按配置；复习模式从 reviewRecord.index 续打）
// immediate：复习模式下 words 同步求值（reviewRecord.words，无网络加载），
// 若在注册前已被消费则 watcher 永不触发 → 面板空白（缺陷 B）；immediate 覆盖两种模式首值。
watch(
  words,
  (newWords) => {
    if (newWords.length === 0) return
    typing.setupChapter(newWords, config.randomConfig.isOpen, dict.isReviewMode ? (dict.reviewRecord?.index ?? 0) : 0)
  },
  { immediate: true },
)

// 加载失败/空数据状态（P0-4）
const isError = computed(() => !!error.value)
const isEmpty = computed(() => !isLoading.value && !isError.value && words.value.length === 0)

// —— window blur 自动暂停 ——
function onBlur() {
  typing.pause()
}
onMounted(() => window.addEventListener('blur', onBlur))
onUnmounted(() => window.removeEventListener('blur', onBlur))

// —— 任意合法字符键开始/继续（Enter 除外，红线 #5） ——
function onGlobalKeydown(e: KeyboardEvent) {
  if (isLoading.value || typing.state.isFinished || typing.state.isTyping) return
  if (e.key === 'Enter') return
  if ((isLegal(e.key) || e.key === ' ') && !e.altKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    typing.start()
  }
}
onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown))

// 非桌面 UA 提示（原行为）
onMounted(() => {
  if (!IsDesktop()) {
    setTimeout(() => toastPersistent('qwerty-learner 需要实体键盘进行练习，建议使用桌面浏览器访问。'), 500)
  }
})

// —— 计时器：isTyping 驱动秒级 tick（暂停即冻结） ——
let timerId: ReturnType<typeof setInterval> | null = null
watch(
  () => typing.state.isTyping,
  (isTyping) => {
    if (isTyping) {
      if (timerId) clearInterval(timerId)
      timerId = setInterval(() => typing.tick(), 1000)
    } else if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  },
)
onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

// —— 章节完成 → 保存章节记录（复习模式 chapter=-1） ——
watch(
  () => [typing.state.isFinished, typing.state.isSavingRecord] as const,
  async ([finished, saving], [prevFinished]) => {
    if (!finished || saving || prevFinished) return
    try {
      await saveChapterRecord(typing.state, { dictId: dict.dictInfo.id, chapter: config.currentChapter, isReview: dict.isReviewMode })
    } catch (e) {
      toastError('章节记录保存失败，请检查浏览器存储', { duration: 4000 })
      console.error('saveChapterRecord failed', e)
    }
  },
)

// confetti（2D 结果页配合；先接入发射）
useConfetti(() => typing.state.isFinished)

// —— 深浅色应用（config store 承载，与 useDarkMode 模块同步） ——
watchEffect(() => {
  // useDarkMode 模块已有独立 watch；此处同步 config.isOpenDarkMode 与 html class（若用户未用过切换按钮则跳过）
  document.documentElement.classList.toggle('dark', config.isOpenDarkMode)
})

// —— Start / Restart（2C 换完整样式） ——
const showRestart = ref(false)

// Enter 开始/暂停（原 StartButton 热键）
useHotkeys(
  'enter',
  () => toggleTyping(),
  { enableOnFormTags: true, preventDefault: true },
)

function toggleTyping() {
  if (isLoading.value) return
  typing.toggleTyping()
}
function restartChapter() {
  typing.repeatChapter(config.randomConfig.isOpen)
}

// —— Skip（错 ≥4 出现） ——
function skipWord() {
  typing.skipWord()
}

// —— SpeedBar（2C 样式细化） ——
const isMobileWidth = ref(window.innerWidth <= 600)
function onResize() {
  isMobileWidth.value = window.innerWidth <= 600
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <Layout>
    <!-- 氛围背景（FxGate 守卫：P1 换 Inspira aurora-background） -->
    <FxGate>
      <div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div class="fx-ambient absolute inset-0 opacity-25 dark:opacity-40" />
      </div>
    </FxGate>

    <AppHeader>
      <div class="flex items-center gap-3">
        <!-- 词书名 + 章节切换（2C：章节 Listbox 集成到词典章节按钮，跳 /gallery） -->
        <AppTooltip content="词典切换">
          <RouterLink to="/gallery" class="flex items-center gap-2 no-underline hover:no-underline">
            <span class="text-sm font-semibold text-indigo-500 hover:underline">{{ dict.dictInfo.name }}{{ dict.isReviewMode ? ' 错题复习' : '' }}</span>
          </RouterLink>
        </AppTooltip>
        <!-- 复习模式隐藏章节徽标（原版 DictChapterButton 复习态隐藏章节下拉） -->
        <span v-if="!dict.isReviewMode" class="text-xs text-gray-400">第 {{ config.currentChapter + 1 }} 章</span>

        <PronunciationSwitcher />
        <Switcher />

        <!-- Start/Pause + hover Restart（原 StartButton 交互） + Enter 热键 -->
        <div class="relative" @mouseenter="showRestart = true" @mouseleave="showRestart = false">
          <AppTooltip content="开始 （Enter）">
            <button
              type="button"
              class="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none"
              :class="typing.state.isTyping ? 'bg-gray-400' : 'bg-indigo-500 shadow-indigo-300'"
              @click="toggleTyping"
            >
              {{ typing.state.isTyping ? 'Pause' : 'Start' }}
            </button>
          </AppTooltip>
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <button
              v-if="showRestart"
              type="button"
              class="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-200 px-3 py-1.5 text-xs text-gray-600 shadow-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
              @click="restartChapter"
            >
              Restart
            </button>
          </Transition>
        </div>

        <!-- Skip（错 ≥4 出现，宽度渐入） -->
        <AppTooltip content="跳过该词">
          <button
            type="button"
            class="rounded-lg bg-orange-400 px-3 py-2 text-sm font-medium text-white transition-all duration-300"
            :class="typing.state.isShowSkip ? '' : 'invisible w-0 px-0 opacity-0'"
            @click="skipWord"
          >
            跳过该词
          </button>
        </AppTooltip>
      </div>
    </AppHeader>

    <!-- 主体 -->
    <div class="relative w-full flex-grow">
      <!-- 加载态 -->
      <div v-if="isLoading" class="flex h-full items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-r-transparent" role="status" aria-label="加载中" />
      </div>

      <!-- 失败态（P0-4：错误卡片 + 重试） -->
      <div v-else-if="isError" class="flex h-full flex-col items-center justify-center gap-4">
        <p class="text-lg font-semibold text-red-500">词书加载失败</p>
        <p class="text-sm text-gray-500">{{ error?.message }}</p>
        <button type="button" class="my-btn-primary" @click="reload">重试</button>
      </div>

      <!-- 空数据态（P0-4） -->
      <div v-else-if="isEmpty" class="flex h-full flex-col items-center justify-center gap-4">
        <p class="text-lg font-semibold text-gray-600 dark:text-gray-300">本章没有可练习的单词</p>
        <RouterLink to="/gallery" class="text-sm text-indigo-400 hover:underline">回到词书选择</RouterLink>
      </div>

      <!-- 正常打字区（完成态隐藏，与原版一致） -->
      <WordPanel v-else-if="!typing.state.isFinished" />
    </div>

    <!-- SpeedBar（原 InfoBox 样式） -->
    <div class="mb-2 w-full px-10">
      <SpeedBar />
    </div>

    <!-- 结果页（完成态） + 捐赠卡（原版同构：isFinished 时同时挂载，触发条件内部判断） -->
    <DonateCard v-if="typing.state.isFinished" />
    <ResultScreen v-if="typing.state.isFinished" />

    <!-- 词表抽屉 -->
    <WordListDrawer />
  </Layout>
</template>

<style scoped>
/* 氛围背景占位（P1 换 Inspira aurora-background） */
.fx-ambient {
  background: radial-gradient(60% 50% at 20% 30%, rgba(99, 102, 241, 0.25), transparent 70%),
    radial-gradient(50% 40% at 80% 20%, rgba(129, 140, 248, 0.2), transparent 70%),
    radial-gradient(50% 60% at 60% 90%, rgba(167, 139, 250, 0.18), transparent 70%);
  animation: fx-ambient-drift 16s ease-in-out infinite alternate;
}
@keyframes fx-ambient-drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(2%, -2%, 0) scale(1.06);
  }
}
@media (prefers-reduced-motion: reduce) {
  .fx-ambient {
    animation: none;
  }
}
</style>
