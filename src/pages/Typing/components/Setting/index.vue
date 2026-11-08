<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import IconX from '~icons/tabler/x'
import IconEar from '~icons/tabler/ear'
import IconAdjustmentsHorizontal from '~icons/tabler/adjustments-horizontal'
import IconEye from '~icons/tabler/eye'
import IconDatabaseCog from '~icons/tabler/database-cog'
import SoundSetting from './SoundSetting.vue'
import AdvancedSetting from './AdvancedSetting.vue'
import ViewSetting from './ViewSetting.vue'
import DataSetting from './DataSetting.vue'
import { useTypingStore } from '@/stores/typing'
import { useUiStore } from '@/stores/ui'

// 平移自原项目 Setting/index.tsx：w-200 面板 + 左列竖排 4 Tab + 即时生效 + 打开暂停打字
// 🆕 P1-8：记忆上次 Tab（ui store）
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [v: boolean] }>()

const typing = useTypingStore()
const ui = useUiStore()

const tabs = [
  { id: 'sound', label: '音效设置', icon: IconEar },
  { id: 'advanced', label: '高级设置', icon: IconAdjustmentsHorizontal },
  { id: 'view', label: '显示设置', icon: IconEye },
  { id: 'data', label: '数据设置', icon: IconDatabaseCog },
]
const activeTab = ref<string>(ui.lastSettingTab)
watch(activeTab, (v) => (ui.lastSettingTab = v))

watch(
  () => props.open,
  (open, old) => {
    if (open) {
      typing.pause() // 原行为：打开设置暂停打字
      if (!old) ui.dialogMounted('setting-dialog') // P0-H：计入 Dialog 守卫
    } else if (old) {
      ui.dialogUnmounted('setting-dialog')
    }
  },
)

function close() {
  emit('update:open', false)
}

// 卸载兜底：开着时组件卸载需释放计数
onUnmounted(() => {
  if (props.open) ui.dialogUnmounted('setting-dialog')
})
</script>

<template>
  <TransitionRoot :show="props.open" as="template">
    <Dialog class="relative z-50" @close="close">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="flex w-200 flex-col overflow-hidden rounded-2xl bg-white p-0 shadow-xl dark:bg-gray-800">
              <div class="relative flex h-22 items-end justify-between rounded-t-lg border-b border-neutral-100 bg-stone-50 px-6 py-3 dark:border-neutral-700 dark:bg-gray-900">
                <span class="text-3xl font-bold text-gray-600">设置</span>
                <button type="button" title="关闭对话框" @click="close">
                  <IconX class="absolute right-7 top-5 cursor-pointer text-gray-400" />
                </button>
              </div>

              <div class="flex h-120 w-full">
                <!-- 左列 Tab.List -->
                <div class="flex h-full w-52 flex-col items-start space-y-3 border-r border-neutral-100 bg-stone-50 px-6 py-3 dark:border-transparent dark:bg-gray-900">
                  <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    type="button"
                    class="flex h-14 w-full cursor-pointer items-center gap-2 rounded-lg px-4 py-2 ring-0 focus:outline-none"
                    :class="activeTab === tab.id && 'bg-gray-200 bg-opacity-50 dark:bg-gray-800'"
                    @click="activeTab = tab.id"
                  >
                    <component :is="tab.icon" class="mr-2 text-neutral-500 dark:text-neutral-300" />
                    <span class="text-neutral-500 dark:text-neutral-300">{{ tab.label }}</span>
                  </button>
                </div>

                <!-- 右侧 Panels -->
                <div class="h-full w-full flex-1">
                  <div v-show="activeTab === 'sound'" class="h-full w-full">
                    <SoundSetting />
                  </div>
                  <div v-show="activeTab === 'advanced'" class="h-full w-full">
                    <AdvancedSetting />
                  </div>
                  <div v-show="activeTab === 'view'" class="h-full w-full">
                    <ViewSetting />
                  </div>
                  <div v-show="activeTab === 'data'" class="h-full w-full">
                    <DataSetting />
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
