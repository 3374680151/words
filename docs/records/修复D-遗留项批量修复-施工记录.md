# 缺陷修复 D：遗留项批量修复（P0-H / 红线 16、22、24 / P0-E）

- 日期：2026-11-08
- 依据：重新验收报告遗留清单；03 文档 P0-8、P0-5、红线 16/22/24
- 状态：✅ 完成并实测（vue-tsc 零错误）

## 1. P0-H：Dialog 打开计数守卫接线（原为死代码）

- 现象：`activeDialogCount` 从未被注册，`hasOpenDialog()` 恒 false——弹窗开着按 Esc/Enter 误跳首页（原版同款 Bug，规划 P0-8 声称修复实际未接线）
- 修复：
  - `stores/ui.ts`：新增模块级 `nextDialogId()`（实例唯一 id）
  - `AppDialog.vue` / `AppAlertDialog.vue`：watch open → dialogMounted/dialogUnmounted，卸载兜底
  - `Setting/index.vue`（Headless UI）：同样注册
  - 消费方 `Gallery/Analysis` 的 `onBack` 早已调用 `hasOpenDialog()`，接线后即生效
- 实测：Gallery 打开 CET-4 详情弹窗 → 合成 Esc/Enter（此前必现误跳）→ **路径保持 /gallery**；点 X 关弹窗 → 守卫释放 → Enter 正常跳回首页。完整生命周期闭环
- 备注：reka-ui 自身对合成 Escape 事件不响应（真实键盘行为待人工确认一次）；X/遮罩关闭路径实测正常

## 2. 红线 22：结果页 Space stopPropagation

- `useHotkeys.ts` 新增 `stopPropagation` 选项；`ResultScreen` Space 热键启用（Firefox 下 preventDefault 不足的原版同款修复）

## 3. 红线 24：打字中空格 preventDefault

- `Word.vue updateInput`：输入空格时对原事件 `preventDefault()`（阻止页面滚动等默认行为，对齐原版 Word/index.tsx:80-84）

## 4. P0-E：统计页加载骨架

- `Analysis/index.vue`：spinner+文案 → 与数据态同构的 5 张占位卡（标题条 + 脉冲柱块，随机高度），加载后无残留（实测 charts=3 且 pulse 清零）

## 5. 红线 16：dictId 非法回写

- `stores/dict.ts reloadCustomDicts` finally 中：currentDictId 不在合成词书表 → 重置 cet4 + 章节归 0（Pinia persist 自动回写 localStorage）
- 实测：写入 `not-exist-dict` → 重载 → stored=`"cet4"`、header 显示 CET-4（对齐原版「重置并持久化」语义）

## 回归

- `pnpm typecheck` 零错误
- 已知边界：reka-ui 对非受信 Escape 事件不关闭弹窗属测试环境限制；AppDialog 计数器经历 SFC 双 script 块 TS2454 坑，最终收敛到 ui store 内 `nextDialogId()`
