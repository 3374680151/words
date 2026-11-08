# 缺陷修复：A 换词不自动发音 · B 复习模式刷新空白

- 日期：2026-11-08
- 触发：交互对照复核（对话留痕 + 复核报告）发现的两处确诊缺陷，C0（自定义词书）前置依赖
- 方法：代码修复 → `vue-tsc` → 浏览器实测（HTMLMediaElement.play 钩子逐词观测 / 复习态刷新恢复）

## 缺陷 A：换词不自动发音（红线 7）

- 现象：从第 2 个词起换词无发音（首词与输错清空后正常）；原版实测每次换词立即播放新词发音
- 根因：`WordPanel :key` 含 `chapterData.index` → 每词重挂载 Word 组件；发音 watch 无 `immediate`，重挂载后依赖无变化不触发。原版 Word 组件复用（key 仅循环计数器），useEffect 挂载必跑
- 修复尝试 1：watch 加 `{ immediate: true, flush: 'post' }` → **实测无效**（发音 ref 位于 AppTooltip 插槽内的条件渲染分支，post 时机不可靠）
- 修复定稿：拆出原版两条触发路径——`onMounted`（换词/循环重打/下一章自动开始）+ 原 watch（暂停恢复 isTyping false→true、输错清空 N→0），语义与原版 useEffect 完全对齐
- 位置：`src/pages/Typing/components/WordPanel/components/Word.vue`（effect 6 + onMounted）
- 实测：逐字母推进 3 次换词（cancel→explosive→numerous→govern），**每次换词均有 dictvoice 播放记录**；朗读按钮手动路径回归正常；无重复播放

## 缺陷 B：复习模式刷新后打字面板空白

- 现象：复习中刷新页面 → 无词/无遮罩/无加载态；原版刷新可续打
- 根因：复习模式 `words` 同步求值（reviewRecord.words，无网络加载），在 `watch(words)` 注册前已被消费 → watcher 永不触发 → `setupChapter` 不执行
- 修复：`watch(words, …, { immediate: true })`（普通模式首值为 []，早退分支不受影响；复习模式首值即词表，注册即 setup）
- 附带：复习模式隐藏「第 N 章」徽标（原版 DictChapterButton 复习态隐藏章节下拉）
- 位置：`src/pages/Typing/index.vue`
- 实测：复习态刷新 → 词表渲染（competent）+「按任意键开始」遮罩 + 错题复习头部 + 章节徽标消失

## 回归口径

- `vue-tsc --noEmit`：零错误
- 未改动：WordPanel :key 策略、循环/听写/复习 store 逻辑、IndexedDB schema
- 待办：P0-H（Dialog 热键守卫死代码）未在本次范围，仍为死代码
