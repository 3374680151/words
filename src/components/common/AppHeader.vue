<script setup lang="ts">
import logo from '@/assets/logo.svg'

// 平移自原项目 components/Header/index.tsx：logo + 标题（外链）+ 右侧 my-card 容器由页面注入按钮组
</script>

<template>
  <header class="container z-20 mx-auto w-full px-10 py-6">
    <div class="flex w-full flex-col items-center justify-between space-y-3 lg:flex-row lg:space-y-0">
      <a
        class="flex items-center text-2xl font-bold text-indigo-500 no-underline hover:no-underline lg:text-4xl"
        href="https://qwerty.kaiyi.cool/"
        target="_blank"
        rel="noreferrer"
      >
        <img :src="logo" class="mr-3 h-16 w-16" alt="Qwerty Learner Logo" />
        <h1>Qwerty Learner</h1>
      </a>
      <nav
        class="my-card on element flex w-auto content-center items-center justify-end space-x-3 rounded-xl bg-white p-4 transition-colors duration-300 dark:bg-gray-800"
      >
        <slot />
      </nav>
    </div>
  </header>
</template>
