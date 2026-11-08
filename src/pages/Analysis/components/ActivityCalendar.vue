<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'
import type { Activity } from '../hooks/useWordStats'

/**
 * 🆕 自研 ActivityCalendar（替代 react-activity-calendar，无 Vue 官方版）
 * 规格：SVG 网格（周列×星期行）、blockSize 22 / radius 7 / fontSize 20、
 * 中文月份/星期标签、图例 少→多、tooltip "{date} 练习 {count} 次"、深浅色两套色板
 */
const props = withDefaults(
  defineProps<{
    title: string
    data: Activity[]
    blockSize?: number
  }>(),
  { blockSize: 15 },
)

const { isDark } = useDarkMode()

const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const PALETTE = computed(() =>
  isDark.value
    ? { empty: 'hsl(0, 0%, 22%)', scale: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'] }
    : { empty: '#f0f0f0', scale: ['#e0e7ff', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5'] },
)

interface Cell {
  date: string
  count: number
  level: number
  column: number
  row: number
  color: string
}

// 布局：按 ISO 周对齐列；行 = 星期（0=日）
const cellSize = computed(() => props.blockSize + 3)
const labelWidth = 32
const labelHeight = 24

const cells = computed<Cell[]>(() => {
  if (props.data.length === 0) return []
  const result: Cell[] = []
  const first = dayjsOf(props.data[0].date)
  // 第一列从周日开始对齐
  let column = 0
  let row = first.getDay()
  props.data.forEach((activity) => {
    if (row > 6) {
      row = 0
      column += 1
    }
    const color =
      activity.level === 0 ? PALETTE.value.empty : PALETTE.value.scale[Math.min(activity.level - 1, PALETTE.value.scale.length - 1)]
    result.push({ ...activity, column, row, color })
    row += 1
  })
  return result
})

const columnsCount = computed(() => cells.value.reduce((max, c) => Math.max(max, c.column + 1), 0))

const width = computed(() => labelWidth + columnsCount.value * cellSize.value + 10)
const height = computed(() => labelHeight + 7 * cellSize.value + 40)

// 月份标签（列首月份变化处）
const monthLabels = computed(() => {
  const labels: { x: number; name: string }[] = []
  let lastMonth = -1
  cells.value.forEach((c) => {
    const month = Number(c.date.slice(5, 7)) - 1
    if (month !== lastMonth && c.row <= 1) {
      lastMonth = month
      labels.push({ x: labelWidth + c.column * cellSize.value, name: MONTHS[month] })
    }
  })
  return labels
})

const totalCount = computed(() => props.data.reduce((acc, d) => acc + d.count, 0))

function dayjsOf(date: string) {
  // 简化：YYYY-MM-DD → new Date（本地时区）
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// tooltip（单个浮动层，避免 365 个 tooltip 实例）
const tooltip = ref<{ show: boolean; x: number; y: number; text: string }>({ show: false, x: 0, y: 0, text: '' })
function onCellEnter(cell: Cell, event: MouseEvent) {
  const host = (event.currentTarget as SVGRectElement).ownerSVGElement?.getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: (host?.left ?? 0) + labelWidth + cell.column * cellSize.value,
    y: (host?.top ?? 0) + labelHeight + cell.row * cellSize.value - 8,
    text: `${cell.date} 练习 ${cell.count} 次`,
  }
}
function onCellLeave() {
  tooltip.value = { ...tooltip.value, show: false }
}

// 星期标签（左侧，隔行显示）
const weekdayLabels = computed(() =>
  WEEKDAYS.map((name, i) => ({ name, y: labelHeight + i * cellSize.value + props.blockSize - 4, show: i % 2 === 1 || i === 0 })),
)
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div class="w-full pb-4 text-center text-xl font-bold text-gray-600 dark:text-white">{{ props.title }}</div>
    <div class="w-full overflow-x-auto customized-scrollbar" style="padding: 40px 60px 20px 60px">
      <svg :width="width" :height="height" :style="{ color: isDark ? '#fff' : '#000' }" role="img" :aria-label="`热力图：${totalCount} 次练习`">
        <!-- 月份标签 -->
        <text v-for="(m, i) in monthLabels" :key="`m${i}`" :x="m.x" y="14" class="fill-current text-[11px]">{{ m.name }}</text>
        <!-- 星期标签 -->
        <text v-for="(w, i) in weekdayLabels" :key="`w${i}`" x="0" :y="w.y" class="fill-current text-[10px]">{{ w.show ? w.name : '' }}</text>
        <!-- 格子 -->
        <rect
          v-for="cell in cells"
          :key="cell.date"
          :x="labelWidth + cell.column * cellSize"
          :y="labelHeight + cell.row * cellSize"
          :width="blockSize"
          :height="blockSize"
          :rx="7"
          :fill="cell.color"
          @mouseenter="onCellEnter(cell, $event)"
          @mouseleave="onCellLeave"
        />
        <!-- 图例：少 □□□□□ 多 -->
        <g :transform="`translate(${width - 240}, ${height - 14})`">
          <text x="0" y="10" class="fill-current text-[11px]">少</text>
          <rect v-for="(c, i) in [PALETTE.empty, ...PALETTE.scale]" :key="i" :x="20 + i * 18" y="0" :width="blockSize - 4" :height="blockSize - 4" :rx="5" :fill="c" />
          <text :x="20 + 5 * 18 + 22" y="10" class="fill-current text-[11px]">多</text>
        </g>
      </svg>
    </div>
    <!-- 总计文案 -->
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">过去一年总计 {{ totalCount }} 次</p>
    <!-- 浮动 tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltip.show"
        class="word-chip-tooltip fixed z-[100]"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        {{ tooltip.text }}
      </div>
    </Teleport>
  </div>
</template>
