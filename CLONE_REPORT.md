# original vs clone · 克隆评估报告

## 结论
- 原站 URL: https://fireflies.ai/
- 克隆 URL: http://localhost:3000/
- 自动推断复杂度: L3
- 复刻模式建议: 视觉复刻 / 内容爆改
- 自动报告边界: 结构、数量、框架、console 可自动比；传入 visual-diff 后可纳入像素差异分。内容残留和法务仍需审计。

## 技术信号
| 项目 | 原站 | 克隆站 |
|---|---|---|
| title | Fireflies.ai | #1 AI Assistant for Meetings, Email, Chat & CRM | Fireflies.ai — AI notes, transcripts and answers for every meeting |
| lang | en | en |
| frameworks | next | react, next |
| scrollHeight | 16435 | 16530 |
| h1 | The #1 AI Assistant For Your Meetings | Turn Every Meeting IntoNotes, Actions, Answers |

## 数量对比
| 指标 | 原站 | 克隆站 | 自动评分 |
|---|---:|---:|---:|
| sections | 7 | 34 | 1/5 |
| links | 189 | 85 | 2/5 |
| images | 108 | 11 | 1/5 |
| video | 1 | 0 | 1/5 |
| canvas | 0 | 0 | 5/5 |
| forms | 0 | 0 | 5/5 |
| buttons | 45 | 29 | 3/5 |
| inputs | 0 | 0 | 5/5 |
| interactive | 254 | 115 | 2/5 |
| scripts | 11 | 6 | 2/5 |

## 复刻评分
- 源证据: 3/5
- 结构保真: 1/5
- 视觉保真: 1/5
- 动效/交互: 3/5
- 响应式: 4/5
- 功能完整: 4/5
- 内容替换: 需人工看文案残留
- 法务/部署风险: 需人工核查 license / 素材

## Console
- 原站 console errors: 7
- 克隆 console errors: 0
- 原站 page errors: 3
- 克隆 page errors: 0

## 路由覆盖
- 未提供 route-crawl 结果。多页面站需要传 --original-routes / --clone-routes。


## 交互覆盖
- 未提供 interaction-probe 结果。交互站需要传 --original-interactions / --clone-interactions。


## 截图证据
- 原站侦察: /Users/kunalpronto/personal/repos/minutes/RECON/original-recon.json
- 克隆侦察: /Users/kunalpronto/personal/repos/minutes/RECON/clone-recon.json
- 像素差异: /Users/kunalpronto/personal/repos/minutes/RECON/visual-diff-1440.json
- 像素差异率: 0.25687360349316546
- 原站截图: screenshots/original-1440.png, screenshots/original-768.png, screenshots/original-390.png
- 克隆截图: screenshots/clone-1440.png, screenshots/clone-768.png, screenshots/clone-390.png

## 已知缺口
- 未传入 visual-diff 时，视觉保真需要打开截图人工确认。
- 法务、素材授权、品牌替换完整度需要人工核查。
