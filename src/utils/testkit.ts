// dev 自检工具出口：保证 evaluate 动态导入时与页面共享同一份模块实例（pinia/vue）
export { createPinia, setActivePinia } from 'pinia'
export { watch, ref, computed, reactive, nextTick } from 'vue'
