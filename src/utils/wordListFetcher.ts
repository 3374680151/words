import type { Word } from '@/types'

export async function wordListFetcher(url: string): Promise<Word[]> {
  const URL_PREFIX: string = import.meta.env.VITE_DEPLOY_ENV === 'pages' ? '/qwerty-learner-vue' : ''

  const response = await fetch(URL_PREFIX + url)
  const words: Word[] = await response.json()
  return words
}
