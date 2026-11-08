<script setup lang="ts">
import Layout from '@/components/common/Layout.vue'

// 静态友链（原项目 3 条），低优先级页面
const links = [
  { name: 'ez背单词', desc: '英语学习工具', url: 'https://ezwords.app/' },
  { name: 'Kai 的博客', desc: '作者博客', url: 'https://kaiyi.cool/' },
  { name: 'Web Worker 播客', desc: '前端播客', url: 'https://webworker.sh/' },
]
</script>

<template>
  <Layout>
    <section class="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">友情链接</h1>
      <ul class="mt-6 space-y-4">
        <li v-for="l in links" :key="l.name" class="rounded-xl bg-white p-4 shadow-md dark:bg-gray-800">
          <a :href="l.url" target="_blank" rel="noreferrer" class="text-lg font-semibold text-indigo-500 hover:underline">
            {{ l.name }}
          </a>
          <p class="text-sm text-gray-400">{{ l.desc }}</p>
        </li>
      </ul>
      <p class="mt-8 text-sm text-gray-400">
        申请友链请邮件 <a class="underline" href="mailto:me@kaiyi.cool">me@kaiyi.cool</a>
      </p>
      <RouterLink to="/" class="mt-6 inline-block text-sm text-indigo-400 hover:underline">返回打字页</RouterLink>
    </section>
  </Layout>
</template>
