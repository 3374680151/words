# 缺陷修复 C：单词发音完全无声（用户实测发现）

- 日期：2026-11-08
- 触发：用户验收反馈「他没有语音（单词的读）」；**用户耳朵发现，自动化此前全部漏检**
- 状态：✅ 修复并实测（play() 结果 REJECTED → played）

## 根因

`src/composables/usePronunciation.ts getAudio()` 给播放用 `<audio>` 设置了
`crossOrigin = 'anonymous'`。有道 `dict.youdao.com/dictvoice` **不返回 CORS 头**，
跨_origin 模式下媒体加载失败（MEDIA_ERR_SRC_NOT_SUPPORTED）→ `play()` 一律抛
`NotSupportedError` → **自初始重构起单词发音从未真正出过声**。

原版为何没此问题：播放走 Howler `html5:true` 的干净元素（无 crossOrigin）；
crossOrigin 只挂在预取 `<audio>` 上（预取失败也静默）。Vue 重构把「预取 hack」
升级为 Map 缓存并统一播放/预取元素时，把 crossOrigin 带进了播放路径。

## 为何此前验收漏检

自动化只断言了「play() 被调用 + 网络请求发出」（performance entries 有 dictvoice
记录），未断言播放 Promise 的结果。transferSize=0/decodedBodySize=0 与
NotSupportedError 才是判决性证据。**教训：音频类验收必须挂 play() Promise 钩子。**

## 修复

- 删除 `getAudio()` 中的 `crossOrigin = 'anonymous'`（附注释防回退）
- 附带收益：预取元素不再因 CORS 静默失败，缓存真正可复用（优于原版预取）

## 实测

1. 手动朗读按钮：play(cancel) → **played**
2. 首词启动自动发音：played
3. 换词自动发音（explosive）：**played**（缺陷 A 修复回归通过）
4. `vue-tsc` 零错误
5. 同环境原版对照：原版 play() = played，Vue 版修复前 = REJECTED —— 非环境问题

## 环境备注

测试沙箱对 github/youdao 等外网受限（fetch 直接拒绝），但 localhost 音频（按键音
Default.wav）不受影响；发音修复后在本沙箱内播放成功，说明 dictvoice 实际可达、
失败根因是 crossOrigin 而非网络。
