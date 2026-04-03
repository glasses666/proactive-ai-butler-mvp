# 2026-04-03 Session Handoff

## 这份文档是干什么的

这是一份给“下次继续开发时的自己”看的 handoff。

目标不是复述全部历史，而是快速回答这几个问题：

- 现在项目已经做到哪了
- 哪些入口已经能用
- 当前架构的边界是什么
- 下次最适合从哪里继续
- 有哪些坑不要再踩一遍

---

## 当前项目一句话定义

`Proactive AI Butler MVP` 现在已经不是一个单纯的 Home Assistant demo，而是一个跑在 R6C 上的“虚拟家庭运行时”：

- 底层用 `Home Assistant + MQTT`
- 中间有 `butler-app` 作为稳定的家庭语义层
- 外部有 `butler-mcp` 作为 agent 可调用的 MCP 工具层
- UI 侧已经有可点击的 pseudo-3D 虚拟家庭界面

当前重点已经从“把设备接上”转移到了“如何让 agent 通过 runtime 和 MCP 理解并操作家庭”。

---

## 已完成的核心里程碑

### 1. Home Assistant 初始化并接入虚拟设备

- HA 已完成 onboarding
- MQTT integration 已接好
- 虚拟设备已经出现在 HA 里，并且可以控制
- 当前接入的主要虚拟设备包括：
  - `Entry Light`
  - `Bedroom Light`
  - `Study Lamp`
  - `Kitchen Light`
  - `Bedroom Curtain`
  - `Bedroom Climate`
  - `House Mode`
  - `Airport Reminder`
  - `Door Lock State`

说明：
- 现在是“虚拟智能家居已接入 HA”，不是空壳状态镜像
- `lock.door_lock_state` 仍被视为高风险对象，后续 agent 侧不应默认放开

### 2. 伪 3D 家庭界面已经可用

- 前端不是平面设备列表，而是一个可点击的 pseudo-3D/isometric 家庭视图
- 可以直接通过界面切换虚拟设备状态
- 已完成中文化，适合继续往展示型方向做

### 3. Runtime API 已抽出来

`butler-app` 现在有一套稳定的 runtime API，不再只是 demo 专用接口。

当前关键接口：

- `GET /api/runtime/summary`
- `GET /api/runtime/devices`
- `GET /api/runtime/executions`
- `POST /api/runtime/device-commands`
- `POST /api/runtime/scene-suggestions`
- `POST /api/runtime/scenes/apply`

这层的定位很明确：

- 不把原始 MQTT 主题或 HA 内部结构直接暴露给 agent
- 先把“家庭运行时”的语义固定下来
- 未来 OpenClaw 或其他 agent runtime 先连这一层

### 4. Butler MCP 已经独立跑起来

现在已经有独立的 `butler-mcp` 服务，不是内嵌在 `butler-app` 里。

当前 MCP tools：

- `household_summary_get`
- `devices_list`
- `device_command_send`
- `scene_suggestions_generate`
- `scene_apply`
- `executions_list_recent`

已经验证过：

- 可以从公网通过 MCP 列工具
- 可以读取家庭摘要
- 可以列出虚拟设备
- 可以生成场景建议
- 可以执行设备命令
- 可以应用高层场景
- 可以读取执行历史

### 5. 官方 HA MCP Server 已启用

R6C 上的 Home Assistant 已开启官方 `mcp_server`。

当前定位：

- `HA MCP` 负责低层设备/实体面
- `Butler MCP` 负责高层家庭语义

这两个不要混成一个概念。

### 6. README 已重写为用户导向版本

README 已经不再是工程师备忘录，而是更像 GitHub 项目首页：

- 先讲项目为什么有意思
- 再讲已经能做什么
- 再讲当前架构和未来方向
- 并补了三张 SVG 配图

对应提交：`b70dba3 Rewrite README for user-facing project story`

---

## 当前线上入口

这些入口在上一轮结束时都已经可用：

- Butler UI / API: `http://8.134.145.209:18787`
- Home Assistant: `http://8.134.145.209:18123`
- Butler MCP health: `http://8.134.145.209:18790/health`
- Butler MCP endpoint: `http://8.134.145.209:18790/mcp`

说明：
- 这些是通过 FRP 暴露出来的外部入口
- 正常工作时优先走 `r6c_remote`
- `r6c_tailnet` 是救援通道，不是首选开发通道

---

## 已验证过的真实操作

不是“理论可行”，而是已经实操通过：

### 通过外部 MCP 完成的操作

- 列出 MCP 工具
- 获取当前家庭摘要
- 列出全部虚拟设备
- 用自然语言生成场景建议
- 控制 `light.entry`
- 应用 `rest_recovery_mode`
- 查看最近执行历史

### 具体效果

当输入：

`我今天很累，回家了`

系统目前会给出 2-3 个候选场景，例如：

- `rest_recovery_mode`
- `prepare_sleep_transition`
- `late_arrival_quiet_return`

然后应用 `rest_recovery_mode` 时，会联动：

- `House Mode -> sleep_guard`
- `Bedroom Climate -> sleep_20c`
- `Entry Light -> on`
- `Airport Reminder -> paused`

这证明现在已经不是“单设备遥控演示”，而是“高层场景驱动的家庭运行时”。

---

## 当前真正的能力边界

这里很重要，避免下次误判系统智能水平。

### 现在有的

- 稳定的虚拟家庭 substrate
- HA 可视化和控制
- 外部 MCP 接入
- 高层 scene API
- 自然语言到场景建议的入口

### 现在没有的

- 真正的 LLM 管家 planner
- 长期记忆
- 多 resident agents
- director agents
- OpenClaw runtime 接入
- 严格的高风险确认流

### 当前“自然语言生成场景”不是 AI planner

这一点已经跟用户明确过：

- 现在的 `scene_suggestions_generate` 还是规则驱动
- 属于“关键词/语义线索 + 当前上下文 -> 候选场景”
- 不是 LLM 自由规划

这一步是有意为之，因为当前阶段在先稳定：

- runtime contract
- MCP surface
- HA / UI / 执行链路

下一个真正智能化的替换点，是把规则推荐器替换成 `LLM scene suggester`，而不是立刻让模型直接控设备。

---

## 现在的架构口径

下次如果继续聊架构，口径统一成这套：

- `Home Assistant`
  - 家庭设备和状态 substrate
- `HA MCP`
  - 低层设备和实体入口
- `butler-app`
  - 稳定的家庭运行时 API
- `butler-mcp`
  - 高层家庭语义工具层
- `OpenClaw`
  - 未来的 agent runtime，不替代 HA，而是跑在上面

一句话：

`OpenClaw 未来驱动 agents，HA 提供家庭世界，Butler Runtime 负责把两边隔开。`

---

## 下次最推荐的开发顺序

如果下次一来就要进入编码，推荐按这个顺序：

### 选项 A：接真正的 AI 场景建议器

这是最自然的下一步。

目标：

- 保留现有 `scene_suggestions_generate` 接口
- 把内部实现从规则版切换为 LLM 版
- 输出仍然限制为候选场景，而不是直接设备动作

为什么先做它：

- 风险低
- 用户可感知价值大
- 不会破坏现有运行时边界
- 能直接验证“像不像管家”

### 选项 B：开始接 OpenClaw

前提是：

- 接受当前 planner 仍是 mock/规则版
- 先把 OpenClaw 当成 runtime 壳，而不是最终智能层

更适合在场景建议器稍微成熟后再做。

### 不建议立刻做的事

- 立刻上 resident agents + director agents
- 立刻让模型直接碰 HA 原始实体
- 立刻把高风险动作如门锁放开

这些都会明显提高复杂度和失控概率。

---

## 最容易忘的几个坑

### 1. 正常开发通道要用 `r6c_remote`

用户明确说过：

- `r6c_remote` 是正常通道
- `r6c_tailnet` 是救援通道

不要再默认用 tailnet 做日常操作。

### 2. OpenWrt 的 `frpc` 不看手写 toml

之前已经踩过这个坑。

这台路由器上的 `frpc` 正常配置方式是：

- 配 `/etc/config/frpc`（UCI）
- 由 init 脚本生成 `/var/etc/frpc.ini`

不要以为改 `/etc/frpc.toml` 就能让服务生效。

### 3. 公开端口现在已经有一套稳定分配

关键外部端口：

- `18123` -> Home Assistant
- `18787` -> Butler UI / API
- `18790` -> Butler MCP

### 4. 有一个本地未跟踪临时文件

当前本地仓库里还有这个未跟踪文件：

- `proactive-ai-butler-mvp-butler-app.tar.gz`

这是部署过程中留下的临时镜像包，不是项目源代码。

---

## 最近的重要提交

最近几次关键里程碑提交：

- `b70dba3` Rewrite README for user-facing project story
- `5b5fa2c` Allow external host access for butler MCP
- `cda0fb9` Document runtime API and MCP probes
- `1726c57` Add standalone butler MCP service
- `745edfb` Add stable runtime API surface
- `b2aaedd` Add butler API extraction architecture
- `1da80d7` Add Home Assistant MCP source audit
- `6a68c5f` Add Home Assistant MCP integration note

如果下次需要快速回忆最近到底做了什么，从这里往回看就够了。

---

## 建议下次开工时先做的 3 件事

1. 先看这份 handoff 和最新 README。
2. 确认线上 3 个入口是否还活着：
   - `18787`
   - `18123`
   - `18790`
3. 再决定是先做：
   - `LLM scene suggester`
   - 还是 `OpenClaw 接入`

---

## 当前结论

项目已经成功从：

`一个会开关虚拟设备的 Home Assistant 实验`

推进成了：

`一个有虚拟家庭、运行时 API、高层场景语义、外部 MCP 入口的 AI 管家试验底座`

下一次再继续时，不需要再回头证明“它能不能连 HA”或者“它能不能被 agent 调用”。

这些基础问题已经回答过了。

接下来该回答的是：

`怎样让这个家庭开始表现得更像一个真正的 AI 管家。`
