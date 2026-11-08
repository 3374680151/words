<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { motionPrefs, motionEnabled, setFxConfig } from '@/composables/useMotionPrefs'
import FxGate from '@/components/common/FxGate.vue'
import FxShinyText from '@/components/effects/FxShinyText.vue'
import FxStarBorder from '@/components/effects/FxStarBorder.vue'
import FxCountUp from '@/components/effects/FxCountUp.vue'
import FxAnimatedContent from '@/components/effects/FxAnimatedContent.vue'
import FxBlurText from '@/components/effects/FxBlurText.vue'
import FxGlareHover from '@/components/effects/FxGlareHover.vue'
import FxSpotlightCard from '@/components/effects/FxSpotlightCard.vue'
import AppButton from '@/components/ui/Button.vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import AppSlider from '@/components/ui/AppSlider.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppAlertDialog from '@/components/ui/AppAlertDialog.vue'
import { toastSuccess, toastError, toastInfo, toastPersistent, useUiStore } from '@/stores/ui'

const { isDark, toggle } = useDarkMode()

// 控件区
const sliderVal = ref(60)
const selectVal = ref('a')
const selectOptions = [
  { key: 'a', label: '选项 A' },
  { key: 'b', label: '选项 B' },
  { key: 'c', label: '选项 C' },
]
const dialogOpen = ref(false)
const confirmOpen = ref(false)
const switchOn = ref(true)
const progress = ref(66)

// 组件目检状态
const fxEnabled = computed({
  get: () => motionPrefs.ambient,
  set: (v) => setFxConfig({ ambient: v }),
})
const countTarget = ref(92)
const ui = useUiStore()

const cards = [
  { name: 'Card 1', desc: 'SpotlightCard 光斑' },
  { name: 'Card 2', desc: 'SpotlightCard 光斑' },
  { name: 'Card 3', desc: 'SpotlightCard 光斑' },
  { name: 'Card 4', desc: 'SpotlightCard 光斑' },
]
</script>

<template>
  <main class="mx-auto max-w-5xl p-8 pb-24">
    <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">/fx-lab 特效试验场</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          所有库组件接入业务页面前的目检区（dev-only）。检查项：深浅色 / 参数 / 性能 / reduced-motion 降级。
        </p>
      </div>
      <div class="flex items-center gap-4">
        <AppSwitch v-model="fxEnabled" label="氛围特效" />
        <AppButton variant="outline" size="sm" @click="toggle">
          {{ isDark ? '🌙 深色' : '☀️ 亮色' }}
        </AppButton>
      </div>
    </header>

    <p
      v-if="!motionEnabled"
      class="mb-6 rounded-lg bg-amber-100 p-3 text-sm text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    >
      当前特效守卫未放行（{{ !motionPrefs.ambient ? '氛围特效已关闭' : motionPrefs.systemReduced ? '系统 reduced-motion' : '硬件分级不足' }}）——
      FxGate 内组件渲染静态降级。
    </p>

    <!-- UI 基础件目检 -->
    <section class="mb-10">
      <h2 class="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">① UI 基础件（shadcn-vue + headlessui）</h2>
      <div class="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
        <div class="flex flex-wrap items-center gap-4">
          <AppButton>默认</AppButton>
          <AppButton variant="destructive">危险</AppButton>
          <AppButton variant="outline">描边</AppButton>
          <AppButton variant="secondary">次要</AppButton>
          <AppButton variant="ghost">幽灵</AppButton>
          <AppButton loading>加载中</AppButton>
          <AppButton disabled>禁用</AppButton>
          <AppTooltip content="Tooltip 内容 · delay 400ms">
            <AppButton variant="ghost">Tooltip hover 我</AppButton>
          </AppTooltip>
          <AppSwitch v-model="switchOn" label="Switch 开关" />
        </div>
        <div class="mt-6 grid gap-6 md:grid-cols-3">
          <div>
            <p class="mb-2 text-xs text-gray-400">Slider（受控 {{ sliderVal }}）</p>
            <AppSlider v-model="sliderVal" :min="0" :max="100" :step="10" aria-label="试验滑杆" />
          </div>
          <div>
            <p class="mb-2 text-xs text-gray-400">Progress（{{ progress }}%）</p>
            <AppProgress :value="progress" />
          </div>
          <div>
            <p class="mb-2 text-xs text-gray-400">Select / Listbox</p>
            <AppSelect v-model="selectVal" :options="selectOptions" />
          </div>
        </div>
        <div class="mt-6 flex flex-wrap gap-4">
          <AppDialog v-model:open="dialogOpen" title="Dialog 标题" description="描述文字，Esc/遮罩可关">
            <AppButton variant="outline" @click="dialogOpen = true">打开 Dialog</AppButton>
            <template #inner>
              <p class="text-sm text-gray-500">Dialog 内容区（zoom+fade 动画）</p>
            </template>
          </AppDialog>
          <AppAlertDialog
            v-model:open="confirmOpen"
            title="删除确认"
            description="将删除「test」的全部记录，此操作不可恢复。"
            confirm-text="删除"
            @confirm="() => {}"
          >
            <AppButton variant="destructive" @click="confirmOpen = true">打开确认弹窗</AppButton>
          </AppAlertDialog>
        </div>
      </div>
    </section>

    <!-- 特效组件目检 -->
    <section class="mb-10">
      <h2 class="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">② 特效组件（vue-bits 移植）</h2>
      <div class="grid gap-6 md:grid-cols-2">
        <div class="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
          <p class="mb-3 text-xs text-gray-400">FxShinyText（扫光周期 5s）</p>
          <h3 class="text-2xl font-bold"><FxShinyText text="按任意键开始" :speed="5" /></h3>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
          <p class="mb-3 text-xs text-gray-400">FxStarBorder（描边流光 6s）</p>
          <FxStarBorder>
            <AppButton class="rounded-xl px-8 py-3">开始练习</AppButton>
          </FxStarBorder>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
          <p class="mb-3 text-xs text-gray-400">
            FxCountUp（mount 触发 · 0.8s power2.out）
            <button class="ml-2 text-indigo-500 underline" @click="countTarget = Math.round(Math.random() * 100)">换数值</button>
          </p>
          <p class="text-5xl font-bold text-indigo-500"><FxCountUp :to="countTarget" :duration="0.8" /></p>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
          <p class="mb-3 text-xs text-gray-400">FxBlurText（逐词 blur 入场）</p>
          <p class="text-xl font-semibold text-gray-800 dark:text-gray-200">
            <FxBlurText text="表现不错！只错了 1 个单词" />
          </p>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
          <p class="mb-3 text-xs text-gray-400">FxGlareHover（hover 扫光）</p>
          <FxGlareHover class="word-chip">
            <span>spotlight</span>
          </FxGlareHover>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
          <p class="mb-3 text-xs text-gray-400">FxAnimatedContent（mount 入场，刷新观察）</p>
          <FxAnimatedContent :distance="24" :duration="0.8">
            <p class="text-sm text-gray-600 dark:text-gray-300">位移 + 透明度 + blur 入场的内容块</p>
          </FxAnimatedContent>
        </div>
      </div>
    </section>

    <!-- SpotlightCard 网格（词书卡片预演） -->
    <section class="mb-10">
      <h2 class="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">③ SpotlightCard 网格（词书卡片预演）</h2>
      <div class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 dic3:grid-cols-3 dic4:grid-cols-4">
        <FxSpotlightCard
          v-for="c in cards"
          :key="c.name"
          class="h-36 w-full rounded-lg bg-zinc-50 p-4 shadow-lg dark:bg-gray-800"
        >
          <p class="text-xl font-semibold text-gray-800 dark:text-gray-100">{{ c.name }}</p>
          <p class="mt-1 truncate text-sm text-gray-400">{{ c.desc }}</p>
        </FxSpotlightCard>
      </div>
    </section>

    <!-- FxGate 降级演示 -->
    <section class="mb-10">
      <h2 class="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">④ FxGate 降级</h2>
      <div class="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
        <FxGate>
          <p class="text-sm text-green-600">特效开启中：此内容由 FxGate 放行</p>
          <template #fallback>
            <p class="text-sm text-gray-400">特效关闭：静态降级内容</p>
          </template>
        </FxGate>
      </div>
    </section>

    <!-- Toast + InfoPanel 目检（工单 1） -->
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">⑤ Toast（vue-sonner）+ InfoPanel</h2>
      <div class="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
        <div class="flex flex-wrap gap-3">
          <AppButton variant="outline" size="sm" @click="toastSuccess('导出成功', { description: 'Qwerty-Learner-User-Data-20261108.gz' })">
            success toast
          </AppButton>
          <AppButton variant="outline" size="sm" @click="toastError('导出失败，请重试')">error toast</AppButton>
          <AppButton variant="outline" size="sm" @click="toastInfo('已复制到剪贴板')">info toast</AppButton>
          <AppButton variant="destructive" size="sm" @click="toastPersistent('您正在使用输入法，请关闭输入法。')">
            常驻 destructive
          </AppButton>
          <AppButton variant="secondary" size="sm" @click="ui.openInfoPanel('donate')">Footer 捐赠面板</AppButton>
          <AppButton variant="secondary" size="sm" @click="ui.openInfoPanel('community')">Footer 微信群面板</AppButton>
        </div>
      </div>
    </section>
  </main>
</template>
