<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import dayjs from 'dayjs'
import IconParty from '~icons/logos/partytown-icon'
import AppButton from '@/components/ui/Button.vue'
import { DONATE_DATE } from '@/constants'
import { db } from '@/utils/db'
import alipay from '@/assets/alipay.jpg'
import weChatImg from '@/assets/weChat.jpg'
import a6 from '@/assets/qrCord/a6.png'
import a12 from '@/assets/qrCord/a12.png'
import a36 from '@/assets/qrCord/a36.png'
import a50 from '@/assets/qrCord/a50.png'
import a66 from '@/assets/qrCord/a66.png'
import w6 from '@/assets/qrCord/w6.png'
import w12 from '@/assets/qrCord/w12.png'
import w36 from '@/assets/qrCord/w36.png'
import w50 from '@/assets/qrCord/w50.png'
import w66 from '@/assets/qrCord/w66.png'

// 平移自原项目 DonateCard + DonatingCard + Amount + AmountQrMap + hooks/useWordStats：
// 章节数 %5 触发 / 30 天记忆（DONATE_DATE）/ 遮罩不可关 / 金额选择 h-0→h-44 展开二维码 / ≥50 贴纸问卷
type AmountType = -1 | 6 | 12 | 36 | 50 | 66
const displayAmount: AmountType[] = [6, 12, 36, 50, 66, -1]

const AmountImageMap: Record<string, [string, string]> = {
  '-1': [alipay, weChatImg],
  6: [a6, w6],
  12: [a12, w12],
  36: [a36, w36],
  50: [a50, w50],
  66: [a66, w66],
}

const show = ref(false)
const amount = ref<AmountType | undefined>(undefined)

const chapterNumber = ref(0)
const wordNumber = ref(0)
const sumWrongCount = ref(0)
const dayFromFirstWord = ref(0)
const dayFromQwerty = dayjs().diff(dayjs('2021-01-21'), 'day')

async function loadStats() {
  const [chapters, words] = await Promise.all([db.chapterRecords.count(), db.wordRecords.count()])
  chapterNumber.value = chapters
  wordNumber.value = words
  const firstRecord = await db.wordRecords.orderBy('timeStamp').first()
  dayFromFirstWord.value = firstRecord?.timeStamp ? dayjs().diff(dayjs.unix(firstRecord.timeStamp), 'day') : 0
}
void loadStats()

// 触发逻辑（原 useLayoutEffect 逐字平移）：章节数 %5 且非 0 → 检查 30 天记忆
watch(
  chapterNumber,
  (n) => {
    if (n && n !== 0 && n % 5 === 0) {
      const stored = localStorage.getItem(DONATE_DATE)
      if (stored) {
        const diff = dayjs().diff(dayjs(stored), 'day')
        if (diff <= 30) return
      }
      show.value = true
    }
  },
  { immediate: true },
)

function onClickHasDonated() {
  show.value = false
  localStorage.setItem(DONATE_DATE, dayjs().format())
}

const qrImages = computed(() => (amount.value !== undefined ? AmountImageMap[String(amount.value)] : null))
</script>

<template>
  <TransitionRoot :show="show" as="template">
    <Dialog class="relative z-50" @close="() => undefined">
      <!-- 遮罩不可关（原 onClose noop 红线 #15） -->
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
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative my-8 w-[37rem] transform select-text overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
              <div class="flex w-full flex-col justify-center gap-4 bg-white px-2 pb-4 pt-5 dark:bg-gray-800 dark:text-gray-300">
                <h1 class="gradient-text w-full pt-3 text-center text-[2.4rem] font-bold">{{ chapterNumber }} Chapters Achievement !</h1>
                <div class="flex w-full flex-col gap-4 px-4">
                  <p class="mx-auto px-4 indent-4">
                    Qwerty Learner 已经陪伴您走过
                    <span class="font-bold text-indigo-500"> {{ dayFromFirstWord }} </span>天，一起完成了
                    <span class="font-bold text-indigo-500"> {{ wordNumber }} </span>
                    个词的练习，帮您纠正了 <span class="font-bold text-indigo-500"> {{ sumWrongCount }} </span>
                    次错误输入。每一次练习，都是您在变得更好的证明
                    <IconParty class="ml-2 inline-block" style="font-size: 16px" />
                    <IconParty class="inline-block" style="font-size: 16px" />
                    <IconParty class="inline-block" style="font-size: 16px" />
                    <br />
                  </p>
                  <p class="mx-auto px-4 indent-4 font-bold">
                    Qwerty Learner 坚持 <span class="font-medium">开源、无广告、无商业化</span> 已经
                    <span class="font-bold text-indigo-500"> {{ dayFromQwerty }} </span>天。
                  </p>
                  <p class="mx-auto px-4 indent-4">
                    随着越来越多的同学加入，服务器和维护成本也在不断增长，
                    <span class="font-semibold text-indigo-600 dark:text-indigo-400">
                      目前项目的运营成本仍由开发者个人承担，Qwerty 的长期运营需要您的一份力量
                    </span>
                    。如果 Qwerty 对您的学习有所帮助，希望您能考虑捐赠支持我们——哪怕是一杯咖啡的金额，都能帮助 Qwerty
                    继续陪伴更多学习者成长。
                  </p>
                  <p class="mx-auto px-4 indent-4">
                    为了感谢您的慷慨，单次 50 rmb 及以上的捐赠， 我们将回赠 Qwerty 的定制贴纸 5 枚
                    <span class="text-xs">（仅限大陆地区）</span>，希望您可以跟朋友分享您的快乐
                  </p>
                </div>

                <!-- DonatingCard -->
                <div class="mt-2 flex w-full flex-col items-center justify-center gap-3">
                  <h2 class="self-start pl-10 font-bold text-gray-800 dark:text-gray-300">选择您的捐赠金额：</h2>
                  <div class="mt-2 flex gap-3">
                    <button
                      v-for="a in displayAmount"
                      :key="a"
                      type="button"
                      class="h-10 rounded border-gray-100 font-bold text-gray-700 shadow-md shadow-gray-300 outline-none hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:opacity-80 dark:shadow-gray-700 hover:dark:bg-gray-600"
                      :class="[a === -1 ? 'w-18' : 'w-10', amount === a ? 'bg-stone-100 dark:bg-gray-500' : '']"
                      @click="amount = a"
                    >
                      {{ a === -1 ? '自定义' : a }}
                    </button>
                  </div>
                  <div
                    class="mt-3 flex w-full flex-col overflow-hidden px-11 transition-[height] duration-500"
                    :class="amount !== undefined ? 'h-44' : 'h-0'"
                  >
                    <div v-if="qrImages" class="flex w-full justify-between">
                      <img :src="qrImages[0]" alt="alipay" class="h-44" />
                      <img :src="qrImages[1]" alt="weChat" class="h-44" />
                    </div>
                  </div>
                  <span v-if="amount !== undefined && (amount >= 50 || amount === -1)">
                    <a
                      class="text-sm font-bold text-gray-500 underline-offset-4 hover:underline dark:text-gray-400"
                      href="https://wj.qq.com/s2/13329666/380d/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      贴纸寄送地址问卷
                    </a>
                  </span>
                </div>

                <div class="flex w-full justify-between px-14 pb-3 pt-0">
                  <AppButton
                    type="button"
                    :class="['w-36 bg-amber-500 font-medium transition-all', !amount && 'invisible']"
                    @click="onClickHasDonated"
                  >
                    我已捐赠
                  </AppButton>
                  <AppButton type="button" class="w-36 font-medium" @click="show = false">下次再说</AppButton>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
