<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { LineChart } from 'echarts/charts'
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import purple from './purple.json'
import { useWindowSize } from '@vueuse/core'
import { useDarkMode } from '@/composables/useDarkMode'

// 平移自原项目 LineCharts：WPM/正确率趋势（dark → dispose 重建，resize 自适应）
echarts.registerTheme('purple', purple)
echarts.use([GridComponent, TitleComponent, TooltipComponent, LineChart, CanvasRenderer])

const props = withDefaults(
  defineProps<{
    title: string
    data: [string, number][]
    name: string
    suffix?: string
  }>(),
  { suffix: '' },
)

const chartRef = ref<HTMLDivElement | null>(null)
const { isDark } = useDarkMode()
const { width, height } = useWindowSize()
let chart: echarts.ECharts | null = null

function render() {
  if (!chartRef.value || !props.data.length) return
  echarts.getInstanceByDom(chartRef.value)?.dispose()
  chart = echarts.init(chartRef.value, isDark.value ? 'purple' : 'light')
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '10%', right: '10%', top: '20%', bottom: '10%' },
    xAxis: {
      type: 'time',
      axisPointer: {
        label: {
          formatter: (params: { seriesData: [{ data: [string, number] }] }) => params.seriesData[0].data[0],
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value: number) => value + props.suffix },
    },
    series: [{ name: props.name, type: 'line', smooth: true, data: props.data, emphasis: { focus: 'series' } }],
  })
}

// chartRef 加入依赖：数据先于挂载就绪时，ref 绑定完成后仍会触发渲染
watch([() => props.data, isDark, chartRef], () => render(), { immediate: true, deep: true, flush: 'post' })
watch([width, height], () => chart?.resize())
onUnmounted(() => chart?.dispose())
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="text-center text-xl font-bold text-gray-600 dark:text-white">{{ props.title }}</div>
    <div ref="chartRef" class="line-chart flex-grow" style="width: 100%; height: 100%" />
  </div>
</template>
