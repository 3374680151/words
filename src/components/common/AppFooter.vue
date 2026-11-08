<script setup lang="ts">
import redBookCode from '@/assets/redBook-code.jpg'
import InfoPanel from './InfoPanel.vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import { useUiStore, type InfoPanelType } from '@/stores/ui'
import IconMail from '~icons/material-symbols/mail'
import IconCoffee2 from '~icons/mdi/coffee'
import IconXiaoHongShu from '~icons/my-icons/xiaohongshu'
import RiLinksLine from '~icons/ri/links-line'
import IconTwitter from '~icons/ri/twitter-fill'
import IconGithub from '~icons/simple-icons/github'
import IconVisualstudiocode from '~icons/simple-icons/visualstudiocode'
import IconWechat2 from '~icons/simple-icons/wechat'
import IconWechat from '~icons/tabler/brand-wechat'
import IconCoffee from '~icons/tabler/coffee'
import IconTerminal2 from '~icons/tabler/terminal-2'
import IconFlagChina from '~icons/twemoji/flag-china'
import { useRouter } from 'vue-router'

// 平移自原项目 components/Footer/index.tsx：8 个入口图标 + 4 个 InfoPanel + 备案/Build
// 注：捐赠面板内 DonatingCard / StickerButton 为 P2 营销组件，后续工单挂载
const ui = useUiStore()
const router = useRouter()
const commitHash = __COMMIT_HASH__

function openPanel(type: InfoPanelType) {
  ui.openInfoPanel(type)
}
function closePanel(type: InfoPanelType) {
  ui.closeInfoPanel(type)
}
</script>

<template>
  <!-- 捐赠 -->
  <InfoPanel
    :open-state="ui.infoPanelState.donate"
    title="Buy us a coffee"
    :icon="IconCoffee"
    button-class-name="bg-amber-500 hover:bg-amber-400"
    icon-class-name="text-amber-500 bg-amber-100 dark:text-amber-300 dark:bg-amber-500"
    :on-close="() => closePanel('donate')"
  >
    <p class="indent-4 text-sm text-gray-500 dark:text-gray-300">
      非常感谢大家使用 Qwerty Learner，目前该网站使用业余时间在维护，为了保证网站能够持续地提供给大家高质量的服务，我们需要您的帮助！
      <br />
      您的捐款将有助于我们支付网站的运营成本，改进网站的功能和设计，并提高用户体验。
      <br />
    </p>
    <br />
    <p class="indent-4 text-sm text-gray-700 dark:text-gray-200">
      我们相信，共同的努力可以让 Qwerty Learner 成为更好的学习平台，也相信您的支持将给予我们持续前进的动力。 感谢您的支持！
    </p>
    <br />
    <p class="indent-4 text-sm text-gray-700 dark:text-gray-200">
      为了感谢您的慷慨，单次 50 rmb 及以上的捐赠， 我们将回赠 Qwerty 的定制贴纸 5 枚<span class="text-xs">（仅限大陆地区）</span>
      ，希望您可以跟朋友分享您的快乐
    </p>
    <div class="flex items-center justify-center py-2">
      <!-- P2：StickerButton 贴纸组件挂载点 -->
    </div>
    <!-- P2：DonatingCard 金额/二维码挂载点 -->
  </InfoPanel>

  <!-- VSCode 插件 -->
  <InfoPanel
    :open-state="ui.infoPanelState.vsc"
    title="VSCode 摸🐟插件"
    :icon="IconTerminal2"
    button-class-name="bg-sky-500 hover:bg-sky-400"
    icon-class-name="text-sky-500 bg-sky-100 dark:text-sky-300 dark:bg-sky-500"
    :on-close="() => closePanel('vsc')"
  >
    <p class="text-sm text-gray-500 dark:text-gray-400">
      我们根据大家的建议开发了 VSCode 插件，支持一键启动，随时开始背单词。
      可以在任意文件中一键开启，开启后单词显示在状态栏中，且插件会拦截用户对文档的输入，不会影响到原始文档。
    </p>
    <br />
    <br />
    <a class="mr-5 underline dark:text-gray-300" href="https://github.com/RealKai42/qwerty-learner-vscode" target="_blank" rel="noreferrer">
      GitHub 项目
    </a>
    <a
      class="underline dark:text-gray-300"
      href="https://marketplace.visualstudio.com/items?itemName=Kaiyi.qwerty-learner"
      target="_blank"
      rel="noreferrer"
    >
      VSCode 插件链接
    </a>
    <br />
  </InfoPanel>

  <!-- 微信社群 -->
  <InfoPanel
    :open-state="ui.infoPanelState.community"
    title="用户反馈社群"
    :icon="IconWechat"
    button-class-name="bg-green-500 hover:bg-green-400"
    icon-class-name="text-green-500 bg-green-100 dark:text-green-300 dark:bg-green-500"
    :on-close="() => closePanel('community')"
  >
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Qwerty Learner 是一个开源项目，旨在为用户提供高质量、可靠的打字练习工具。
      <br />
      加入我们的用户社群后，您可以与我们的开发团队进行沟通，分享您的使用体验和建议，帮助我们改进产品，同时也能够及时了解我们的最新动态和更新内容。
      <br />
      <br />
    </p>
    <p class="text-sm text-gray-700 dark:text-gray-200">
      我们深信，与用户的良好互动和反馈是推动我们不断前进和提高的重要因素。因此，我们诚挚邀请您加入我们的社群，与我们一起打造更好的
      「Qwerty Learner」！
    </p>
    <br />
    <p class="text-sm text-gray-500 dark:text-gray-400">再次感谢您的支持和关注！</p>
    <br />
    <img class="ml-1 w-2/6" src="https://qwerty.kaiyi.cool/weChat-group.png" alt="weChat-group" />
    <br />
  </InfoPanel>

  <!-- 小红书 -->
  <InfoPanel
    :open-state="ui.infoPanelState.redBook"
    title="小红书社群"
    :icon="IconXiaoHongShu"
    button-class-name="bg-red-500 hover:bg-red-400"
    icon-class-name="text-red-500 bg-red-100 dark:text-red-600 dark:bg-red-500"
    :on-close="() => closePanel('redBook')"
  >
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Qwerty Learner 是一个开源项目，旨在为用户提供高质量、可靠的打字练习工具。
      <br />
      关注小红书后，您可以获得开发团队的最新动态和更新内容，反馈您的使用体验和建议，帮助我们改进产品。
      <br />
      <br />
    </p>
    <p class="text-sm text-gray-700 dark:text-gray-200">
      我们深信，与用户的良好互动和反馈是推动我们不断前进和提高的重要因素。因此，我们诚挚邀请您关注我们的小红书账号，与我们一起打造更好的
      「Qwerty Learner」！
    </p>
    <br />
    <img class="ml-1 w-5/12" :src="redBookCode" alt="redBook" />
    <p class="text-sm text-gray-500 dark:text-gray-400">Tips: 从小红书"我"的左上角点击 三 找到 扫一扫</p>
    <br />
  </InfoPanel>

  <footer class="mb-1 mt-4 flex w-full items-center justify-center gap-2.5 text-sm ease-in">
    <a href="https://github.com/RealKai42/qwerty-learner" target="_blank" rel="noreferrer" aria-label="前往 GitHub 项目主页">
      <IconGithub class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100" style="font-size: 15px" />
    </a>

    <button class="cursor-pointer" type="button" aria-label="加入我们的小红书社群" @click="openPanel('redBook')">
      <IconXiaoHongShu class="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500" style="font-size: 14px" />
    </button>

    <button class="cursor-pointer focus:outline-none" type="button" aria-label="加入我们的微信用户群" @click="openPanel('community')">
      <IconWechat2 class="text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-500" style="font-size: 16px" />
    </button>

    <a href="https://twitter.com/real_kai42" target="_blank" title="x" rel="noreferrer">
      <IconTwitter class="text-gray-500 hover:text-[#1DA1F2] dark:text-gray-400 dark:hover:text-[#1DA1F2]" style="font-size: 16px" />
    </a>

    <button class="cursor-pointer focus:outline-none" type="button" aria-label="考虑捐赠我们" @click="openPanel('donate')">
      <IconCoffee2 class="text-gray-500 hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-500" style="font-size: 16px" />
    </button>

    <button class="cursor-pointer focus:outline-none" type="button" aria-label="使用 Visual Studio Code 插件版 Qwerty Learner" @click="openPanel('vsc')">
      <IconVisualstudiocode class="text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-500" style="font-size: 14px" />
    </button>

    <a href="mailto:me@kaiyi.cool" target="_blank" rel="noreferrer" aria-label="发送邮件到 me@kaiyi.cool">
      <IconMail class="text-gray-500 hover:text-indigo-400 dark:text-gray-400 dark:hover:text-indigo-400" style="font-size: 16px" />
    </a>

    <a rel="noreferrer" class="cursor-pointer focus:outline-none" aria-label="查看友链" @click="router.push('/friend-links')">
      <RiLinksLine class="text-gray-500 hover:text-indigo-400 dark:text-gray-400 dark:hover:text-indigo-400" style="font-size: 14px" />
    </a>

    <AppTooltip content="中国大陆镜像">
      <a href="https://kaiyiwing.gitee.io/qwerty-learner" target="_self" title="前往中国大陆镜像">
        <IconFlagChina style="font-size: 16px" />
      </a>
    </AppTooltip>

    <button
      class="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      type="button"
      @click="openPanel('donate')"
    >
      @ Qwerty Learner
    </button>

    <a
      class="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      href="https://beian.miit.gov.cn"
      target="_blank"
      rel="noreferrer"
    >
      鲁ICP备2022030649号
    </a>
    <span class="select-none rounded bg-slate-200 px-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      Build <span class="select-all">{{ commitHash }}</span>
    </span>
  </footer>
</template>
