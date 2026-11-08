<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import IconMoon from '~icons/heroicons/moon-solid'
import IconSun from '~icons/heroicons/sun-solid'
import IconLanguage from '~icons/tabler/language'
import IconLanguageOff from '~icons/tabler/language-off'
import IconKeyboard from '~icons/tabler/keyboard'
import IconCog from '~icons/heroicons/cog-6-tooth-solid'
import IconBook from '~icons/bxs/book'
import IconChartLine from '~icons/tabler/chart-line'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import SettingDialog from './Setting/index.vue'
import SoundSwitcher from './SoundSwitcher.vue'
import LoopWordSwitcher from './LoopWordSwitcher.vue'
import WordDictationSwitcher from './WordDictationSwitcher.vue'
import { useTypingStore } from '@/stores/typing'
import { useDarkMode } from '@/composables/useDarkMode'
import { useHotkeys } from '@/composables/useHotkeys'
import { CTRL } from '@/utils'

// 平移自原项目 Switcher：8 个工具按钮（音效/循环/默写/释义/错题本/统计/深色/指法图）+ 设置
const typing = useTypingStore()
const router = useRouter()
const { isDark, toggle: toggleDark } = useDarkMode()

const handPositionOpen = ref(false)
const settingOpen = ref(false)

// 设置弹窗打开即暂停打字（原行为，工单 6 完整实现面板）
watch(settingOpen, (open) => {
  if (open) typing.pause()
})

function changeTransVisibleState(e?: Event) {
  typing.toggleTrans()
  if (e) (e.currentTarget as HTMLElement)?.blur()
}
function changeDarkModeState(e?: Event) {
  toggleDark()
  if (e) (e.currentTarget as HTMLElement)?.blur()
}

useHotkeys(
  'ctrl+shift+v',
  () => changeTransVisibleState(),
  { enableOnFormTags: true, preventDefault: true },
)
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <AppTooltip content="音效设置">
      <SoundSwitcher />
    </AppTooltip>

    <AppTooltip class="h-7 w-7" content="设置单个单词循环">
      <LoopWordSwitcher />
    </AppTooltip>

    <AppTooltip class="h-7 w-7" :content="`开关默写模式（${CTRL} + V）`">
      <WordDictationSwitcher />
    </AppTooltip>

    <AppTooltip class="h-7 w-7" :content="`开关释义显示（${CTRL} + Shift + V）`">
      <button
        class="p-[2px] text-lg focus:outline-none"
        :class="typing.state.isTransVisible ? 'text-indigo-500' : 'text-gray-500'"
        type="button"
        :aria-label="`开关释义显示（${CTRL} + Shift + V）`"
        @click="changeTransVisibleState"
      >
        <IconLanguage v-if="typing.state.isTransVisible" />
        <IconLanguageOff v-else />
      </button>
    </AppTooltip>

    <AppTooltip content="错题本">
      <button
        class="p-[2px] text-lg text-gray-500 hover:text-indigo-500 focus:outline-none"
        type="button"
        aria-label="错题本"
        @click="router.push('/error-book')"
      >
        <IconBook class="icon" />
      </button>
    </AppTooltip>

    <AppTooltip class="h-7 w-7" content="查看数据统计">
      <button
        class="p-[2px] text-lg text-gray-500 hover:text-indigo-500 focus:outline-none"
        type="button"
        aria-label="查看数据统计"
        @click="router.push('/analysis')"
      >
        <IconChartLine class="icon" />
      </button>
    </AppTooltip>

    <AppTooltip class="h-7 w-7" content="开关深色模式">
      <button
        class="p-[2px] text-lg text-indigo-500 focus:outline-none"
        type="button"
        aria-label="开关深色模式"
        @click="changeDarkModeState"
      >
        <IconMoon v-if="isDark" class="icon" />
        <IconSun v-else class="icon" />
      </button>
    </AppTooltip>

    <AppTooltip content="指法图示">
      <button
        class="p-[2px] text-lg text-gray-500 hover:text-indigo-500 focus:outline-none"
        type="button"
        aria-label="指法图示"
        @click="handPositionOpen = true"
      >
        <IconKeyboard class="icon" />
      </button>
    </AppTooltip>

    <AppTooltip content="设置">
      <button
        class="p-[2px] text-lg text-gray-500 hover:text-indigo-500 focus:outline-none"
        type="button"
        aria-label="设置"
        @click="settingOpen = true"
      >
        <IconCog class="icon" />
      </button>
    </AppTooltip>

    <!-- 指法图弹窗 -->
    <AppDialog v-model:open="handPositionOpen" title="标准指法图">
      <template #inner>
        <img src="@/assets/standard_typing_hand_position.png" alt="标准指法图" class="mx-auto" />
      </template>
    </AppDialog>

    <!-- 设置弹窗（工单 6） -->
    <SettingDialog :open="settingOpen" @update:open="(v: boolean) => (settingOpen = v)" />
  </div>
</template>
