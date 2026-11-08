import { Howl, Howler } from 'howler'
import { useConfigStore } from '@/stores/config'
import { keySoundResources, KEY_SOUND_URL_PREFIX } from '@/resources/soundResource'
import type { SoundResource } from '@/types'
import noop from '@/utils/noop'

/**
 * 按键音/提示音（替代 use-sound）：howler 懒创建、interrupt:true（连击不叠音）、
 * 开关关闭返回 noop、resource 失效回退 Default 并回写配置（原行为逐字保留）
 */

type PlayFunction = () => void

function resolveResource(resource: SoundResource): SoundResource {
  // 配置里的 resource 不在资源列表时回退 Default（原 useKeySounds 行为）
  return keySoundResources.some((r) => r.key === resource.key) ? resource : keySoundResources[0]
}

function createHowl(url: string, volume: number, html5 = false): Howl {
  return new Howl({
    src: [url],
    volume,
    html5,
    format: html5 ? ['mp3'] : ['wav'],
    preload: true,
  })
}

/** interrupt 语义（原 use-sound）：play 前先 stop，连击不叠音 */
function interruptPlay(howl: Howl): void {
  howl.stop()
  howl.play()
}

/** [按键音, 错误提示音, 完成提示音] */
export function useKeySounds(): [PlayFunction, PlayFunction, PlayFunction] {
  const config = useConfigStore()

  // —— 按键音 ——
  let keyHowl: Howl | null = null
  let keyUrl = ''
  function playKeySound(): void {
    if (!config.keySounds.isOpen || !config.keySounds.isOpenClickSound) return noop()
    const resource = resolveResource(config.keySounds.resource)
    const url = KEY_SOUND_URL_PREFIX + resource.filename
    if (!keyHowl || keyUrl !== url) {
      keyHowl?.unload()
      keyHowl = createHowl(url, config.keySounds.volume)
      keyUrl = url
    } else {
      keyHowl.volume(config.keySounds.volume)
    }
    interruptPlay(keyHowl)
  }

  // —— 错误提示音 ——
  let wrongHowl: Howl | null = null
  function playWrongSound(): void {
    if (!config.hintSounds.isOpen || !config.hintSounds.isOpenWrongSound) return noop()
    if (!wrongHowl) {
      wrongHowl = createHowl('./sounds/' + config.hintSounds.wrongResource.filename, config.hintSounds.volume)
    } else {
      wrongHowl.volume(config.hintSounds.volume)
    }
    interruptPlay(wrongHowl)
  }

  // —— 完成提示音 ——
  let correctHowl: Howl | null = null
  function playCorrectSound(): void {
    if (!config.hintSounds.isOpen || !config.hintSounds.isOpenCorrectSound) return noop()
    if (!correctHowl) {
      correctHowl = createHowl('./sounds/' + config.hintSounds.correctResource.filename, config.hintSounds.volume)
    } else {
      correctHowl.volume(config.hintSounds.volume)
    }
    interruptPlay(correctHowl)
  }

  return [playKeySound, playWrongSound, playCorrectSound]
}

/** 设置页试听：独立一次性播放指定资源 */
export function playKeySoundResource(soundResource: SoundResource): void {
  const sound = new Howl({ src: [KEY_SOUND_URL_PREFIX + soundResource.filename], format: ['wav'] })
  Howler.volume(1)
  sound.play()
}
