# 1. 测试目标与测试金字塔

你这个项目的风险点在：**对局实时状态、匹配、匿名展示、支付/积分、复盘回放、代理分润展示**。
 所以建议金字塔是：

1. **单元测试（60%）**：纯函数/算法（金额计算、UI 状态派生、时间线格式化）
2. **组件测试（25%）**：ActionBar、SeatList、ReplayTimeline 等关键组件
3. **端到端 E2E（15%）**：从登录→大厅→匹配→对局→结算→复盘全链路

------

# 2. 工具选型（适配 uni-app）

## 2.1 单测/组件测

- **Vitest + @vue/test-utils**
  - 适合 Vue3 + TS
  - 速度快、和 Vite/uniapp CLI 友好

## 2.2 E2E 分三条线

1. **H5 端 / 管理后台（如果也是 Web）**：
   - **Playwright**（推荐）
   - 稳定、并行、支持多浏览器、适合 CI。[testomat.io+3hot.dawoai.com+3CSDN博客+3](https://hot.dawoai.com/posts/2025/vue3-end-to-end-testing-practical-guide-playwright?utm_source=chatgpt.com)
2. **小程序端（微信/抖音等）**：
   - **uni-automator（uni-app 官方自动化）**
   - 能直接驱动 uni-app 页面对象，在小程序/H5 都可用。[uniapp.dcloud.io](https://uniapp.dcloud.io/worktile/auto/uniapp-cli-project.html?utm_source=chatgpt.com)
3. **APP 端（Android/iOS）**：
   - **Maestro**（移动端 E2E）
   - 脚本少、跨平台、对弱网/动画容错好；2025 仍是移动 UI 自动化热门方案。[CSDN博客+2掘金+2](https://blog.csdn.net/gitblog_00572/article/details/153858696?utm_source=chatgpt.com)

> 结论：
>
> - **H5：Playwright**
> - **小程序/uniapp页面级：uni-automator**
> - **APP真机/模拟器：Maestro**

------

# 3. 具体测试流程（按开发阶段）

## 3.1 开发期：TDD/自测

### A. 单元测试（Vitest）

覆盖点：

- 下注/按钮状态派生：`allowedActions → UI`
- 复盘时间线格式化
- 金额展示/四舍五入
- 匹配倒计时/重连退避策略
- 距离提示文案

示例（`utils/bet.spec.ts`）：

```
import { describe, it, expect } from "vitest";
import { minRaise } from "@/utils/bet";

describe("bet utils", () => {
  it("min raise equals lastRaise", () => {
    expect(minRaise(50)).toBe(50);
  });
});
```

### B. 关键组件测试（Vue Test Utils）

组件：

- `ActionBar.vue`：按钮 enable/disable 是否严格受 `allowedActions` 控制
- `SeatItem.vue`：匿名信息是否泄露（不能出现 nickname 等字段）
- `ReplayTimeline.vue`：时间线渲染稳定

示例：

```
import { mount } from "@vue/test-utils";
import ActionBar from "@/components/table/ActionBar.vue";

it("only allowed actions clickable", async () => {
  const w = mount(ActionBar, {
    props: { allowed: ["pass"], lastRaise: 50 }
  });
  expect(w.get('[data-act="pass"]').attributes("disabled")).toBeUndefined();
  expect(w.get('[data-act="raise"]').attributes("disabled")).toBeDefined();
});
```

------

## 3.2 集成期：E2E 冒烟（每天至少一次）

### A. H5 Playwright 冒烟

场景：

1. 短信登录（用 test 账号 token 或 mock 码）
2. 进入大厅 → 拉到场次列表
3. 进入匹配 → 匹配成功跳牌桌
4. 牌桌收到 state → 操作栏渲染
5. 退出 → 查看记录列表

Playwright 例子（`tests/e2e/smoke.spec.ts`）：

```
import { test, expect } from "@playwright/test";

test("smoke: login -> hall -> match -> table", async ({ page }) => {
  await page.goto("/#/pages/login/index");
  await page.fill('input[data-id="phone"]', "13800000000");
  await page.fill('input[data-id="code"]', "000000"); // 测试环境固定码
  await page.click('button[data-id="login"]');
  await expect(page).toHaveURL(/hall/);

  await page.click('button[data-id="scene-1-join"]');
  await expect(page).toHaveURL(/match/);

  await page.waitForSelector('[data-id="table-seat-list"]', { timeout: 60000 });
  await expect(page.locator('[data-id="action-bar"]')).toBeVisible();
});
```

### B. 小程序 uni-automator 冒烟

uni-app 官方流程是：

- `npm run test:h5` 驱动 H5/小程序页面对象。[uniapp.dcloud.io](https://uniapp.dcloud.io/worktile/auto/uniapp-cli-project.html?utm_source=chatgpt.com)

例子（`tests/uni/hall.test.js`）：

```
describe('hall', () => {
  let page;
  beforeAll(async () => {
    page = await program.reLaunch('/pages/hall/index');
    await page.waitFor(1000);
  });

  it('scenes loaded', async () => {
    const cards = await page.$$('.scene-card');
    expect(cards.length).toBeGreaterThan(0);
  });
});
```

### C. APP Maestro 冒烟

Maestro 用 YAML 描述流程，快且稳。[掘金+1](https://juejin.cn/post/7483709254849101865?utm_source=chatgpt.com)

`maestro/smoke.yaml`：

```
appId: com.xxx.dapaisu
---
- launchApp
- tapOn: "手机号"
- inputText: "13800000000"
- tapOn: "验证码"
- inputText: "000000"
- tapOn: "登录"
- assertVisible: "匹配大厅"
- tapOn: "快速匹配"
- assertVisible: "匹配中"
- waitForAnimationToEnd
- assertVisible: "牌桌"
```

------

## 3.3 回归期：全量 E2E（发版前）

必须覆盖的全链路：

1. **登录→绑定邀请码→充值→余额变化**
2. **匹配限制**：
   - 关闭定位时提示/降级场次
   - 近距离两机不可同桌
3. **对局 3 轮规则 UI**
   - 第一圈 pass/call/raise 按 allowedActions
   - 第二圈拖动=敲波波
   - 第三圈无发照入口直接比牌
4. **结算页/记录页**
5. **复盘时间线一致**
6. **匿名不泄露**（截图比对/文本扫描）

------

# 4. AI 自动化测试（怎么真正省人）

AI 不是替代框架，而是**生成用例/生成脚本/自愈定位**。2025 的主流做法是：Playwright + AI 生成/维护脚本。[知乎专栏+2jangwook.net+2](https://zhuanlan.zhihu.com/p/1913189157649511228?utm_source=chatgpt.com)

## 4.1 用 AI 自动生成 E2E 用例

输入给 AI 的材料：

- PRD（你已经有）
- 页面路由
- 关键 data-id 规范（见 4.3）

让 AI 产出：

- 冒烟用例列表
- 回归用例列表（含前置条件、步骤、断言）
- 再让 AI 输出 Playwright/Maestro 脚本骨架

> 你以后每次改需求，把差异段落贴给 AI，它会“增量更新”用例。

## 4.2 用 AI 生成/补全 Playwright 脚本

方式：

- IDE 里用 Copilot/ChatGPT
- 给出“意图描述 + 页面元素约定”，AI 自动写出脚本
- 再人工过一遍关键断言

这种生成方式已很普遍，能显著减少重复劳动。[知乎专栏+1](https://zhuanlan.zhihu.com/p/1913189157649511228?utm_source=chatgpt.com)

## 4.3 **必须做的前置：可测试性设计**

为了让 AI 生成脚本可靠，**所有关键节点必须加 data-id**：

**文案/按钮/区域**：

- 登录按钮：`data-id="login"`
- 场次卡：`data-id="scene-{id}"`
- 匹配按钮：`data-id="scene-{id}-join"`
- 牌桌操作栏：`data-id="action-bar"`
- 复盘入口：`data-id="replay-entry"`

**做法**（统一组件属性透传）：

```
<button :data-id="dataId">...</button>
```

## 4.4 AI 自愈（减少脚本脆弱）

策略：

1. **优先按 data-id 找元素**
2. 找不到时 fallback 文案/role
3. AI 生成 patch（自动修 locator）

Playwright 中常用写法：

```
const btn = page.getByTestId("login").or(page.getByText("登录"));
```

## 4.5 AI 自动巡检（夜间跑）

- 定时跑“冒烟 + 关键回归”
- AI 自动生成报告：
  - 失败步骤截图
  - DOM/日志
  - 可能原因与定位建议

（很多团队用 Testomat/自建 LLM 报告总结，思路一致。[testomat.io](https://testomat.io/blog/playwright-ai-revolution-in-test-automation/?utm_source=chatgpt.com)）

------

# 5. CI/CD 测试流水线

## 5.1 分支策略

- feature → PR
- develop（日构建）
- release（发版前全量回归）

## 5.2 GitHub Actions / GitLab CI 示例

**PR 时：**

1. lint + typecheck
2. vitest 单测
3. H5 playwright 冒烟

**release 时：**

1. 全量 vitest
2. Playwright 回归
3. uni-automator（小程序）
4. Maestro（Android模拟器）
5. 汇总报告 → 通知群

------

# 6. 你这个项目的“必测清单”（AI 也按这个生成）

1. 匿名信息：全链路不出现对手昵称/头像/地区
2. allowedActions：按钮永远不越权
3. 第二圈拖动触发 knock_bobo
4. 第三圈无发照入口
5. 断线重连：状态一致
6. 复盘时间线 == round_logs
7. 余额守恒展示：结算前后余额 UI 合理
8. 定位拒绝/授权/近距离拦截