import confetti from 'canvas-confetti'
import { watch, onUnmounted } from 'vue'

/**
 * 章节完成彩带（原行为逐字保留）：isFinished 后 250ms 左侧、400ms 右侧双侧发射
 * 默认参数与原项目 CONFETTI_DEFAULTS 一致：5 色方形纸片、ticks 500
 */
const CONFETTI_DEFAULTS: confetti.Options = {
  colors: ['#5D8C7B', '#F2D091', '#F2A679', '#D9695F', '#8C4646'],
  shapes: ['square'],
  ticks: 500,
}

export function useConfetti(isFinished: () => boolean): void {
  const timers: ReturnType<typeof setTimeout>[] = []

  const stop = watch(isFinished, (finished) => {
    if (!finished) return
    timers.push(
      setTimeout(() => {
        confetti({
          ...CONFETTI_DEFAULTS,
          particleCount: 50,
          angle: 60,
          spread: 100,
          origin: { x: 0 },
        })
      }, 250),
    )
    timers.push(
      setTimeout(() => {
        confetti({
          ...CONFETTI_DEFAULTS,
          particleCount: 50,
          angle: 120,
          spread: 100,
          origin: { x: 1 },
        })
      }, 400),
    )
  })

  onUnmounted(() => {
    stop()
    timers.forEach(clearTimeout)
  })
}
