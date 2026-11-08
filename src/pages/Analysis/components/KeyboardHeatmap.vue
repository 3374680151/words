<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { BarChart, MapChart } from 'echarts/charts'
import { GeoComponent, ToolboxComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import Keyboard from './keyboard'
import purple from './purple.json'
import { useWindowSize } from '@vueuse/core'
import { useDarkMode } from '@/composables/useDarkMode'

// 平移自原项目 KeyboardWithBarCharts：键盘热力图 ↔ 柱状图 universalTransition 动画切换（红线 #18）
echarts.use([BarChart, CanvasRenderer, GeoComponent, MapChart, ToolboxComponent, TooltipComponent, UniversalTransition, VisualMapComponent])
echarts.registerTheme('purple', purple)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
echarts.registerMap('Keyboard', Keyboard as any)

const props = withDefaults(
  defineProps<{
    title: string
    data: { name: string; value: number }[]
    name: string
    suffix?: string
  }>(),
  { suffix: '' },
)

const chartRef = ref<HTMLDivElement | null>(null)
const { isDark } = useDarkMode()
const { width, height } = useWindowSize()
let chart: echarts.ECharts | null = null

const keyboardData = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').map((k) => ({ name: k, value: 0 }))

function render() {
  if (!chartRef.value || !props.data.length) return

  const myData = keyboardData
    .map((item) => {
      const find = props.data.find((_) => _.name === item.name)
      return { ...item, value: find?.value || 0 }
    })
    .sort((a, b) => b.value - a.value)

  echarts.getInstanceByDom(chartRef.value)?.dispose()
  chart = echarts.init(chartRef.value, isDark.value ? 'purple' : 'light')

  const mapOption = {
    tooltip: { trigger: 'item', showDelay: 0, transitionDuration: 0.2 },
    toolbox: {
      feature: {
        restore: {},
        myToBarChart: {
          show: true,
          title: '切换为柱状图',
          icon: 'path://M896 928 768 928C732.656 928 704 899.344 704 864L704 416C704 380.656 732.656 352 768 352L896 352C931.344 352 960 380.656 960 416L960 864C960 899.344 931.344 928 896 928ZM896 416 768 416 768 864 896 864 896 416ZM576 928 448 928C412.656 928 384 899.344 384 864L384 160C384 124.656 412.656 96 448 96L576 96C611.344 96 640 124.656 640 160L640 864C640 899.344 611.344 928 576 928ZM576 160 448 160 448 864 576 864 576 160ZM256 928 128 928C92.656 928 64 899.344 64 864L64 544C64 508.656 92.656 480 128 480L256 480C291.344 480 320 508.656 320 544L320 864C320 899.344 291.344 928 256 928ZM256 544 128 544 128 864 256 864 256 544Z',
          onclick: () => {
            chart?.setOption(barOption, true)
          },
        },
      },
    },
    visualMap: {
      left: 'right',
      min: 0,
      max: myData[0].value,
      inRange: { color: isDark.value ? ['hsl(0, 0%, 22%)', '#818cf8'] : ['#f0f0f0', '#6366f1'] },
      text: ['多', '少'],
      textStyle: { color: isDark.value ? '#fff' : '#000' },
      calculable: true,
    },
    series: [
      {
        name: props.name,
        id: 'population',
        type: 'map',
        roam: true,
        map: 'Keyboard',
        animationDurationUpdate: 1000,
        universalTransition: true,
        data: myData,
        label: { show: true, color: isDark.value ? '#fff' : '#000' },
      },
    ],
  }

  const barOption = {
    tooltip: { trigger: 'axis' },
    toolbox: {
      feature: {
        restore: {},
        myToKeyboard: {
          show: true,
          title: '切换为键盘热力图',
          icon: 'path://M192 448h64v64H192zM384 448h64v64h-64zM576 448h64v64h-64zM768 448h64v64h-64zM192 320h64v64H192zM384 320h64v64h-64zM576 320h64v64h-64zM768 320h64v64h-64zM256 640h512v64H256z M1024 864H0V256h64v544h896V224H0V160h1024v704z',
          onclick: () => {
            chart?.setOption(mapOption, true)
          },
        },
      },
    },
    yAxis: { type: 'value', minInterval: 1 },
    xAxis: { type: 'category', axisLabel: { rotate: 30 }, data: myData.map((item) => item.name) },
    animationDurationUpdate: 1000,
    series: {
      name: props.name,
      type: 'bar',
      id: 'population',
      data: myData.map((item) => item.value),
      color: isDark.value ? '#818cf8' : '#6366f1',
      universalTransition: true,
    },
  }

  chart.setOption(mapOption)
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
