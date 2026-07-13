import { useMemo, useState } from "react";
import {
  capabilityRegistry,
  createApiProvider,
  type ApiProvider,
  type ProviderType,
} from "./domain/appModel.ts";
import { createInitialApiProviders } from "./mockData.ts";

type PlatformId = "xiaohongshu" | "douyin" | "gongzhonghao" | "shipinhao" | "kuaishou";
type ContentType = "text" | "imageText" | "video";
type WritingMode = "article" | "shortNote" | "rewrite";
type WritingSkillId = "content-agent" | "khazix-writer" | "guizang-ppt";
type ImageTextMode = "cover" | "cards" | "imagePrompt" | "guizangVisual";
type ViewMode = "creator" | "api";

type Platform = {
  id: PlatformId;
  name: string;
  description: string;
  fit: string[];
};

type ContentForm = {
  id: ContentType;
  name: string;
  description: string;
};

type GzhTheme = {
  id: string;
  label: string;
  primary: string;
  accent: string;
  paper: string;
};

type WritingSkill = {
  id: WritingSkillId;
  label: string;
  description: string;
};

type ProviderForm = {
  name: string;
  providerType: ProviderType;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  supportedCapabilityIds: string[];
  notes: string;
};

const providerTypeLabels: Record<ProviderType, string> = {
  "openai-compatible": "OpenAI 兼容",
  "image-generation": "图像生成",
  "video-generation": "视频生成",
  rendering: "渲染执行",
  "skill-runner": "Skill Runner",
};

const platforms: Platform[] = [
  {
    id: "xiaohongshu",
    name: "小红书",
    description: "种草、案例、清单、图文封面强。",
    fit: ["强标题", "短段落", "收藏感"],
  },
  {
    id: "douyin",
    name: "抖音",
    description: "短视频钩子、强节奏、口播脚本。",
    fit: ["3秒开场", "强冲突", "行动指令"],
  },
  {
    id: "gongzhonghao",
    name: "公众号",
    description: "深度文章、观点表达、可复制排版。",
    fit: ["长文结构", "目录", "微信 HTML"],
  },
  {
    id: "shipinhao",
    name: "视频号",
    description: "可信表达、知识沉淀、私域转发。",
    fit: ["稳重", "观点", "转发友好"],
  },
  {
    id: "kuaishou",
    name: "快手",
    description: "真实场景、直接表达、生活化卖点。",
    fit: ["接地气", "强场景", "少包装"],
  },
];

const contentForms: ContentForm[] = [
  {
    id: "text",
    name: "纯文字",
    description: "文章、笔记、口播文案、公众号排版。",
  },
  {
    id: "imageText",
    name: "图文",
    description: "封面标题、图文卡片、配图提示词。",
  },
  {
    id: "video",
    name: "视频",
    description: "先生成视频提示词，视频 API 后续接入。",
  },
];

const gzhThemes: GzhTheme[] = [
  { id: "moyu-green", label: "摸鱼绿", primary: "#059669", accent: "#A7F3D0", paper: "#f7fbf7" },
  { id: "red-white", label: "红白色系", primary: "#DC2626", accent: "#FECACA", paper: "#fffafa" },
  { id: "graphite-minimal", label: "石墨极简风", primary: "#52525B", accent: "#52525B", paper: "#fafafa" },
  { id: "zen-whitespace", label: "留白禅意风", primary: "#4A5D52", accent: "#B5C8BC", paper: "#fffdf8" },
  { id: "moyu-ticket", label: "摸鱼票据风", primary: "#059669", accent: "#A7F3D0", paper: "#fff8e7" },
  { id: "olive-journal", label: "橄榄手记", primary: "#1e1f23", accent: "#ed7b2f", paper: "#fbfbf2" },
];

const writingSkills: WritingSkill[] = [
  {
    id: "content-agent",
    label: "通用改写",
    description: "把卖点改成平台用户能听懂的表达。",
  },
  {
    id: "khazix-writer",
    label: "Khazix Writer",
    description: "公众号长文口吻，有好奇心、活人感和亲自下场的叙事。",
  },
  {
    id: "guizang-ppt",
    label: "Guizang PPT",
    description: "把文章拆成 PPT、封面和图文卡片的视觉结构。",
  },
];

const defaultBrief = "GEO AI搜索优化招商，首月合作特惠最高50%，目标是让本地商家理解 AI 搜索优化的价值并预约咨询。";
const defaultArticle = `# GEO 招商：别再只盯关键词排名

很多老板以为 GEO 就是把品牌名塞进更多页面里。真正有效的做法，是让 AI 在回答用户问题时更愿意引用你。

> 判断标准很简单：用户搜问题时，AI 能不能把你说成可信答案。

## 01 先做可引用资产
把官网、案例页、FAQ、媒体报道和创始人观点整理成结构化内容，让 AI 有稳定来源可以抓取。

## 02 再做场景覆盖
围绕用户真实问题写内容，比如“AI 搜索优化怎么收费”“本地商家怎么做 GEO”“品牌如何进入 AI 推荐”。

## 03 最后做转化承接
不要只做曝光。每篇内容都要有明确行动：咨询、领取方案、预约诊断或查看案例。`;

const platformById = (id: PlatformId) => platforms.find((platform) => platform.id === id) ?? platforms[0];
const formById = (id: ContentType) => contentForms.find((form) => form.id === id) ?? contentForms[0];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const highlightKeywords = (value: string, theme: GzhTheme) =>
  escapeHtml(value).replace(
    /(GEO|AI|搜索优化|转化|品牌|招商|试点|可引用内容|小红书|抖音|公众号|视频号|快手)/g,
    `<span style="color:${theme.primary};font-weight:700;border-bottom:2px solid ${theme.accent};">$1</span>`,
  );

const buildGzhHtml = (article: string, theme: GzhTheme) => {
  const lines = article
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const title = lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "") ?? "公众号文章";
  const headings = lines
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^##\s+/, ""));

  const content = lines
    .filter((line) => !line.startsWith("# "))
    .map((line, index) => {
      if (line.startsWith("## ")) {
        const heading = line.replace(/^##\s+/, "");
        return `<section style="margin:34px 0 18px;"><section style="display:inline-block;background:${theme.primary};color:#fff;padding:7px 12px;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:.5px;">PART ${String(index + 1).padStart(2, "0")}</section><h2 style="margin:12px 0 0;color:#111827;font-size:22px;line-height:1.45;font-weight:800;">${escapeHtml(heading)}</h2></section>`;
      }

      if (line.startsWith(">")) {
        return `<blockquote style="margin:24px 0;padding:18px 20px;border-left:5px solid ${theme.accent};background:#fff7ed;color:#374151;font-size:16px;line-height:1.9;font-weight:600;">${highlightKeywords(line.replace(/^>\s*/, ""), theme)}</blockquote>`;
      }

      return `<p style="margin:16px 0;color:#374151;font-size:16px;line-height:2;letter-spacing:.2px;">${highlightKeywords(line, theme)}</p>`;
    })
    .join("");

  const toc = headings.length
    ? `<section style="margin:24px 0;padding:18px 20px;background:#fff;border:1px solid #E5E7EB;border-radius:14px;"><p style="margin:0 0 10px;color:${theme.primary};font-size:14px;font-weight:800;">本文目录</p>${headings
        .map(
          (heading, index) =>
            `<p style="margin:8px 0;color:#4B5563;font-size:15px;line-height:1.7;"><span style="display:inline-block;width:24px;height:24px;margin-right:8px;border-radius:50%;background:${theme.primary};color:#fff;text-align:center;line-height:24px;font-size:12px;font-weight:700;">${index + 1}</span>${escapeHtml(heading)}</p>`,
        )
        .join("")}</section>`
    : "";

  return `<section style="max-width:677px;margin:0 auto;padding:24px 18px;background:${theme.paper};font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',Arial,sans-serif;">
  <section style="padding:24px 22px;border-radius:18px;background:#fff;box-shadow:0 10px 30px rgba(15,23,42,.08);">
    <p style="margin:0 0 12px;color:${theme.accent};font-size:13px;font-weight:800;letter-spacing:1px;">CONTENT AGENT</p>
    <h1 style="margin:0;color:#111827;font-size:26px;line-height:1.35;font-weight:900;">${escapeHtml(title)}</h1>
    <p style="margin:14px 0 0;color:#6B7280;font-size:15px;line-height:1.8;">用结构化排版降低阅读阻力，把观点、案例和行动指令拆成读者能快速扫读的模块。</p>
  </section>
  ${toc}
  ${content}
  <section style="margin:34px 0 0;padding:22px 20px;border-radius:18px;background:${theme.primary};color:#fff;">
    <p style="margin:0 0 8px;font-size:18px;font-weight:900;">下一步行动</p>
    <p style="margin:0;font-size:15px;line-height:1.8;">发布前检查图片、二维码和承接页，再保存为后续内容模板。</p>
  </section>
</section>`;
};

const buildArticleDraft = ({
  platform,
  mode,
  brief,
  skillId,
}: {
  platform: Platform;
  mode: WritingMode;
  brief: string;
  skillId: WritingSkillId;
}) => {
  const topic = brief.trim() || defaultBrief;

  if (mode === "shortNote") {
    return `# ${platform.name}短文：3秒让用户明白价值

开头：如果你的客户已经开始问 AI“哪家公司靠谱”，但 AI 回答里没有你，这就是 GEO 要解决的问题。

正文：
1. 先把服务说清楚：你解决谁的问题，结果是什么。
2. 再把证据补齐：案例、FAQ、官网结构、媒体提及。
3. 最后给行动：领取诊断、预约咨询、看案例。

素材：${topic}

结尾：想先判断你的品牌有没有被 AI 推荐，可以先做一次 3 个关键词的小测试。`;
  }

  if (mode === "rewrite") {
    if (platform.id === "gongzhonghao" && skillId === "guizang-ppt") {
      return `# 归藏视觉拆稿：把这篇公众号变成 PPT / 头图 / 图文

原始素材：${topic}

## 01 核心观点
AI 搜索时代，品牌不是在争一个关键词排名，而是在争 AI 替用户做判断时，会不会把你放进候选答案。

一句话主标题：
AI 不提你，客户先看见别人

副标题：
GEO 不是堆关键词，而是把品牌变成可被 AI 引用的可信答案。

## 02 公众号 21:9 头图
画幅：21:9
风格：Style B 瑞士国际主义，克莱因蓝 IKB 锚点色，白底、直角、1px 发丝线、强网格。
版式：左侧 65% 放大标题，右侧 35% 放搜索问答抽象图形。
标题：AI 不提你
副标题：客户先看见别人
视觉元素：搜索框、AI 回答卡片、品牌名高亮块。
限制：不要复杂背景，不要把正文塞进画面，不要圆角卡片堆叠。

## 03 公众号分享卡 1:1
画幅：1:1
主文案：
GEO 招商试点
让你的品牌进入 AI 推荐答案
结构：上方大标题，中部一个 AI 问答框，下方放行动词“测 3 个关键词”。
视觉重心：一个高亮品牌名从回答里浮现。

## 04 小红书 3:4 图文封面
画幅：3:4
大标题：
AI 搜索里没有你
客户就先看见别人
副标题：本地商家 GEO 试点方案
版式：标题占 55%，视觉占 30%，底部行动提示占 15%。
风格：瑞士风 + 少量电子杂志感，字大、留白足、单一视觉锚点。

## 05 6 页图文卡片节奏
P1 封面：AI 搜索里没有你，客户就先看见别人
P2 问题：用户已经开始直接问 AI 推荐服务商
P3 误区：GEO 不是把品牌名塞进更多页面
P4 方法：官网、案例、FAQ、观点，整理成可引用资产
P5 测试：先跑 3 个核心问题，看 AI 是否提到你
P6 转化：领取诊断表 / 预约咨询 / 查看案例

## 06 8 页演讲 PPT 节奏
1. Cover：AI 不提你，客户先看见别人
2. Statement：搜索入口正在从网页变成答案
3. Problem：品牌缺席 AI 回答，就缺席用户候选名单
4. Framework：可引用资产 = 官网 + 案例 + FAQ + 媒体 + 创始人观点
5. Diagram：用户问题 → AI 抓取 → 可信内容 → 品牌被引用
6. Case Placeholder：放一个本地商家的前后对比案例
7. Action：先用 3 个关键词做小测试
8. Closing：从排名竞争，进入答案竞争

## 07 配图提示词
生成一张 21:9 信息图，白底，瑞士国际主义网格，克莱因蓝高饱和锚点色。画面表现“用户问题进入 AI 搜索框，AI 回答中品牌名称被高亮引用”。不要真实品牌 logo，不要页脚，不要标题栏，不要装饰边框。`;
    }

    if (platform.id === "gongzhonghao" && skillId === "khazix-writer") {
      return `# ${platform.name}改写稿，别再只盯关键词排名

故事是这样的。

这两天我一直在想 GEO 这件事。

以前我们做搜索优化，脑子里默认有一个画面，用户打开搜索框，输入关键词，翻结果页，然后点进某个网站。

但现在这个画面已经变了。

很多用户不翻网页了。

他直接问 AI。

比如，本地商家怎么做 AI 搜索优化，哪家公司靠谱，GEO 到底怎么收费。

然后 AI 给他一个答案。

如果这个答案里没有你的品牌，你不是少了一个排名。

你是直接从这次对话里消失了。

这个感觉其实挺吓人的。

因为它不像传统搜索那样，第二页第三页多少还能捡点流量。AI 回答很多时候只有一屏，甚至只有一句推荐。用户看到谁，谁就进入了他的候选名单。

回到 ${topic} 这件事。

我觉得真正要做的，不是把品牌名硬塞到更多页面里。

那玩意没用。

你要做的是让你的官网、案例页、FAQ、服务说明、创始人观点，变成 AI 愿意引用的内容。

这块听起来有点虚，我换个更具体的说法。

用户问，AI 搜索优化适合本地商家吗。

你的内容里最好已经有一篇文章，把适合谁、不适合谁、怎么开始、预算怎么估、多久能看到结果，都讲清楚。

用户问，GEO 和 SEO 有什么区别。

你的内容里最好已经有一个 FAQ，用普通老板听得懂的话，把这个区别讲明白。

用户问，有没有真实案例。

你的案例页最好不是一句客户增长明显，而是写清楚之前是什么状态，做了哪些内容资产，AI 回答里后来出现了什么变化。

你看，这不是玄学。

这是把原本散落在销售话术、朋友圈、官网角落里的东西，整理成 AI 能读懂、用户也能读懂的资产。

我有时候觉得，GEO 最有价值的地方不是技术本身。

而是逼着一个公司重新回答一个问题。

你到底凭什么值得被推荐。

如果这个问题答不清楚，别说 AI 了，人也不会推荐你。

所以我会建议本地商家先别上来就搞大而全。

先拿 3 个核心问题做测试。

用户最可能怎么问。

AI 现在怎么答。

你的品牌有没有出现。

如果没有出现，是因为你没有内容，还是内容不够可信，还是内容结构太乱。

把这 3 个问题跑通，再做 10 篇内容的小试点。

这事儿不性感。

但它很实在。

它不是让你追一个新的流量神话，而是让你在新的答案入口里，有资格被看见。

大时代啊，朋友们。

以前我们争的是排名。

现在争的是，AI 在替用户做判断的时候，会不会想起你。`;
    }

    return `# ${platform.name}改写版：把卖点改成用户能听懂的话

原始素材：${topic}

改写思路：
不要先讲技术名词，先讲用户正在失去什么机会。

改写正文：
现在用户不只在搜索引擎里找答案，也会直接问 AI。
如果 AI 的答案里没有你的品牌，你就失去了一个新的入口。
GEO AI 搜索优化要做的，不是堆关键词，而是让你的品牌、案例和服务说明变成 AI 更容易引用的可信内容。

行动指令：
本月可以先用 3 个核心问题测试，看你的品牌是否会被 AI 提到，再决定是否扩大内容覆盖。`;
  }

  return `# ${platform.name}文章初稿：GEO 招商的内容生产路径

## 01 先给判断
${topic}

真正的问题不是“要不要做内容”，而是你的内容能不能进入用户现在使用的新入口：AI 搜索、推荐回答和平台内搜索。

## 02 再给方法
第一步，整理品牌可引用资产：官网、案例、FAQ、服务页、创始人观点。
第二步，围绕用户真实问题写内容：价格、效果、适合谁、不适合谁、怎么开始。
第三步，每篇内容都要接一个明确动作：咨询、领取方案、查看案例或预约诊断。

## 03 最后给转化
建议先用 10 篇内容做试点，不追求大而全，先验证目标关键词和 AI 回答里的品牌出现率。`;
};

const buildImageTextOutput = ({
  platform,
  mode,
  brief,
}: {
  platform: Platform;
  mode: ImageTextMode;
  brief: string;
}) => {
  const topic = brief.trim() || defaultBrief;

  if (mode === "cards") {
    return `图文卡片结构｜${platform.name}

主题：${topic}

第1张：大标题
“你的品牌，正在被 AI 搜索忽略吗？”

第2张：痛点
用户问 AI 推荐服务商，但答案里没有你。

第3张：解释
GEO 不是堆关键词，而是让品牌内容更容易被 AI 引用。

第4张：方法
官网结构、案例页、FAQ、媒体提及、创始人观点统一整理。

第5张：行动
先测 3 个关键词，看 AI 是否提到你的品牌。

第6张：转化
领取 GEO 诊断表 / 预约咨询 / 查看案例。`;
  }

  if (mode === "imagePrompt") {
    return `配图生成提示词｜${platform.name}

画面：一位本地商家老板站在电脑前，屏幕显示 AI 搜索问答结果，品牌名称以高亮卡片形式出现。
风格：干净商业插画，明亮背景，蓝橙点缀，信息图风格，适合小红书/公众号封面。
构图：左侧人物，右侧搜索结果卡片，顶部留标题空间。
文字区域：预留 30% 空白，方便放置“AI 搜索里没有你，就等于少一个入口”。
限制：不要复杂背景，不要真实品牌 logo，不要低清晰度，不要杂乱小字。`;
  }

  if (mode === "guizangVisual") {
    return `归藏 PPT 视觉稿｜${platform.name}

核心素材：${topic}

适配能力：
- 长文章变 6-10 页演讲 PPT
- 公众号 21:9 头图 / 1:1 分享卡
- 小红书 3:4 封面和轮播
- PPT 配图、信息图、流程图、截图统一风格

推荐风格：
Style B 瑞士国际主义。原因是 GEO / AI 搜索优化属于方法论和产品分析，适合强网格、单一高饱和锚点色、事实表达，而不是装饰性排版。

公众号 21:9 头图：
标题：AI 不提你，客户先看见别人
副标题：GEO 招商试点方案
画面：左侧大标题，右侧 AI 搜索回答卡片，品牌名以克莱因蓝色块高亮。
比例：21:9
限制：不放大段正文，不做圆角卡片堆叠，不画页脚。

公众号 1:1 分享卡：
标题：让品牌进入 AI 推荐答案
结构：顶部标题，中部搜索框和答案卡片，底部行动词“先测 3 个关键词”。
视觉：白底、黑字、克莱因蓝锚点色、1px 发丝线分区。

小红书 3:4 封面：
大标题：
AI 搜索里没有你
客户就先看见别人
副标题：本地商家 GEO 试点
版式：标题占 55%，右下角放 AI 回答高亮示意。

6 页图文卡片：
1. AI 搜索里没有你，客户就先看见别人
2. 用户开始直接问 AI 推荐服务商
3. GEO 不是堆关键词
4. 可引用资产：官网、案例、FAQ、媒体、观点
5. 先测 3 个关键词
6. 预约诊断 / 领取方案 / 查看案例

8 页 PPT 节奏：
1. Cover：AI 不提你，客户先看见别人
2. 入口变化：从网页搜索到 AI 答案
3. 风险：品牌缺席答案，缺席候选名单
4. 框架：可引用资产
5. 流程：用户问题 → AI 抓取 → 可信内容 → 品牌被引用
6. 案例页：前后对比
7. 行动页：3 个关键词试点
8. Closing：从排名竞争到答案竞争`;
  }

  return `封面方案｜${platform.name}

核心素材：${topic}

封面标题：
AI 搜索里没有你
客户就先看见别人

副标题：
GEO 招商试点方案

视觉：
高对比标题 + 搜索框元素 + 品牌被引用的高亮卡片。

版式：
上方 20% 放小标签“GEO 招商”
中间 55% 放大标题
下方 25% 放行动提示“先测 3 个关键词”

配色：
白底、黑字、蓝色强调，加入少量橙色提示转化。`;
};

const buildVideoPrompt = ({ platform, brief }: { platform: Platform; brief: string }) => {
  const topic = brief.trim() || defaultBrief;

  return `视频提示词｜${platform.name}

主题：${topic}

模型：Seedance 2.0 / Wan 2.5
画幅：9:16 竖屏
时长：8-12秒

分镜：
0-2秒：搜索框里输入“本地商家怎么做 AI 搜索优化”，结果页快速弹出，制造问题钩子。
2-4秒：镜头推近品牌缺席的回答区域，字幕出现“AI 不提你，客户先看见别人”。
4-7秒：切到品牌内容资产卡片：官网、案例、FAQ、媒体提及，卡片快速排列。
7-10秒：品牌名称被 AI 回答高亮引用，出现咨询按钮和优惠信息。

节奏：快速卡点、硬切、关键词弹跳、搜索界面动效。
音效：click、whoosh、轻电子鼓点。
限制词：不要低饱和、不要杂乱小字、不要虚假截图、不要真实第三方商标。`;
};

const writeClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      throw new Error("Unable to copy content");
    }
  }
};

export function App() {
  const initialProviders = useMemo(createInitialApiProviders, []);
  const [viewMode, setViewMode] = useState<ViewMode>("creator");
  const [selectedPlatformId, setSelectedPlatformId] = useState<PlatformId>("xiaohongshu");
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("video");
  const [brief, setBrief] = useState(defaultBrief);
  const [workspaceStarted, setWorkspaceStarted] = useState(false);
  const [writingMode, setWritingMode] = useState<WritingMode>("article");
  const [writingSkillId, setWritingSkillId] = useState<WritingSkillId>("content-agent");
  const [imageTextMode, setImageTextMode] = useState<ImageTextMode>("cover");
  const [themeId, setThemeId] = useState(gzhThemes[0].id);
  const [article, setArticle] = useState(defaultArticle);
  const [copied, setCopied] = useState("");
  const [providers, setProviders] = useState<ApiProvider[]>(initialProviders);
  const [providerForm, setProviderForm] = useState<ProviderForm>({
    name: "",
    providerType: "openai-compatible",
    baseUrl: "",
    apiKey: "",
    modelName: "",
    supportedCapabilityIds: ["article.rewrite"],
    notes: "",
  });
  const [adminError, setAdminError] = useState("");

  const platform = platformById(selectedPlatformId);
  const contentForm = formById(selectedContentType);
  const selectedTheme = gzhThemes.find((theme) => theme.id === themeId) ?? gzhThemes[0];

  const articleDraft = useMemo(
    () => buildArticleDraft({ platform, mode: writingMode, brief, skillId: writingSkillId }),
    [platform, writingMode, brief, writingSkillId],
  );
  const gzhHtml = useMemo(
    () => buildGzhHtml(article, selectedTheme),
    [article, selectedTheme],
  );
  const imageTextOutput = useMemo(
    () => buildImageTextOutput({ platform, mode: imageTextMode, brief }),
    [platform, imageTextMode, brief],
  );
  const videoPrompt = useMemo(() => buildVideoPrompt({ platform, brief }), [platform, brief]);

  const copyText = async (key: string, value: string) => {
    await writeClipboard(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1400);
  };

  const beginWorkspace = () => {
    setViewMode("creator");
    setWorkspaceStarted(true);
    if (selectedContentType === "text" && !article.trim()) {
      setArticle(articleDraft);
    }
  };

  const returnToConsole = () => {
    setViewMode("creator");
    setWorkspaceStarted(false);
  };

  const openContentWorkspace = (contentType: ContentType) => {
    setViewMode("creator");
    setSelectedContentType(contentType);
    setWorkspaceStarted(true);
    if (contentType === "text" && !article.trim()) {
      setArticle(articleDraft);
    }
  };

  const changeWritingSkill = (skillId: WritingSkillId) => {
    setWritingSkillId(skillId);
    if (selectedContentType === "text" && writingMode === "rewrite") {
      setArticle(buildArticleDraft({ platform, mode: writingMode, brief, skillId }));
    }
  };

  const changeProviderCapability = (capabilityId: string) => {
    setProviderForm((current) => {
      const selected = current.supportedCapabilityIds.includes(capabilityId);

      return {
        ...current,
        supportedCapabilityIds: selected
          ? current.supportedCapabilityIds.filter((id) => id !== capabilityId)
          : [...current.supportedCapabilityIds, capabilityId],
      };
    });
  };

  const addProvider = () => {
    setAdminError("");

    if (!providerForm.name.trim() || !providerForm.baseUrl.trim() || !providerForm.apiKey.trim()) {
      setAdminError("请填写名称、Base URL 和 API Key。");
      return;
    }

    if (providerForm.supportedCapabilityIds.length === 0) {
      setAdminError("至少选择一个适用能力。");
      return;
    }

    try {
      const provider = createApiProvider({
        actorRole: "administrator",
        name: providerForm.name.trim(),
        providerType: providerForm.providerType,
        baseUrl: providerForm.baseUrl.trim(),
        apiKey: providerForm.apiKey.trim(),
        modelName: providerForm.modelName.trim() || "default",
        supportedCapabilityIds: providerForm.supportedCapabilityIds,
        notes: providerForm.notes.trim(),
      });

      setProviders((current) => [provider, ...current]);
      setProviderForm({
        name: "",
        providerType: "openai-compatible",
        baseUrl: "",
        apiKey: "",
        modelName: "",
        supportedCapabilityIds: ["article.rewrite"],
        notes: "",
      });
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "添加 API Provider 失败。");
    }
  };

  return (
    <main className="app-frame">
      <aside className="notion-sidebar" aria-label="主导航">
        <div className="sidebar-brand">
          <span className="workspace-dot" aria-hidden="true" />
          <div>
            <strong>内容生产 Agent</strong>
            <small>{platform.name} / {contentForm.name}</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={viewMode === "creator" && !workspaceStarted ? "nav-item active" : "nav-item"}
            onClick={returnToConsole}
          >
            控制台
          </button>
          <button
            className={
              viewMode === "creator" && workspaceStarted && selectedContentType === "text"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => openContentWorkspace("text")}
          >
            纯文字
          </button>
          <button
            className={
              viewMode === "creator" && workspaceStarted && selectedContentType === "imageText"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => openContentWorkspace("imageText")}
          >
            图文
          </button>
          <button
            className={
              viewMode === "creator" && workspaceStarted && selectedContentType === "video"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => openContentWorkspace("video")}
          >
            视频
          </button>
          <button
            className={viewMode === "api" ? "nav-item active" : "nav-item"}
            onClick={() => setViewMode("api")}
          >
            后台 API
          </button>
        </nav>

        <div className="sidebar-meta">
          <span>当前平台</span>
          <strong>{platform.name}</strong>
          <small>{platform.fit.join(" / ")}</small>
        </div>
      </aside>

      <section
        className={
          viewMode === "api"
            ? "app-shell is-admin"
            : workspaceStarted
              ? "app-shell is-workspace"
              : "app-shell is-console"
        }
      >
        <header className="app-header">
          <div>
            <p className="eyebrow">Content Creator Agent</p>
            <h1>{viewMode === "api" ? "后台 API 管理" : "自媒体内容生产控制台"}</h1>
          </div>
          <div className="header-actions">
            <nav className="view-switch" aria-label="主视图">
              <button
                className={viewMode === "creator" ? "active" : ""}
                onClick={returnToConsole}
              >
                创作工作台
              </button>
              <button
                className={viewMode === "api" ? "active" : ""}
                onClick={() => setViewMode("api")}
              >
                后台 API
              </button>
            </nav>
            <div className="context-pill">
              {viewMode === "api" ? `${providers.length} 个 Provider` : `${platform.name} / ${contentForm.name}`}
            </div>
          </div>
        </header>

        {viewMode === "api" ? (
          <AdminApiWorkspace
            adminError={adminError}
            form={providerForm}
            providers={providers}
            onAddProvider={addProvider}
            onCapabilityChange={changeProviderCapability}
            onFormChange={setProviderForm}
          />
        ) : (
          <>
            {workspaceStarted ? (
              <section className="task-summary-panel">
                <div>
                  <strong>当前任务</strong>
                  <p>
                    {platform.name} / {contentForm.name} / {platform.fit.join(" / ")}
                    <br />
                    {brief}
                  </p>
                </div>
                <button className="secondary-action" onClick={returnToConsole}>
                  修改平台和形式
                </button>
              </section>
            ) : (
              <section className="console-panel">
                <div className="console-copy">
              <div>
                <p className="eyebrow">任务设置</p>
                <h2>选择平台和内容形式</h2>
                <p>先定发布场景，再进入对应生产页。</p>
              </div>
              <div className="console-action">
                <span>
                  {platform.name} / {contentForm.name} / {platform.fit.join(" / ")}
                </span>
                <button className="primary-action" onClick={beginWorkspace}>
                  开始生成
                </button>
              </div>
                </div>

                <div className="selector-block">
              <div className="block-head">
                <span>平台</span>
                <strong>{platform.name}</strong>
              </div>
              <div className="choice-grid platform-grid">
                {platforms.map((item) => (
                  <button
                    key={item.id}
                    className={item.id === selectedPlatformId ? "choice-card active" : "choice-card"}
                    onClick={() => {
                      setSelectedPlatformId(item.id);
                      setWorkspaceStarted(false);
                    }}
                  >
                    <span>{item.name}</span>
                    <small>{item.description}</small>
                  </button>
                  ))}
                </div>
                </div>

                <div className="selector-block">
              <div className="block-head">
                <span>内容形式</span>
                <strong>{contentForm.name}</strong>
              </div>
              <div className="choice-grid form-grid">
                {contentForms.map((item) => (
                  <button
                    key={item.id}
                    className={item.id === selectedContentType ? "choice-card active" : "choice-card"}
                    onClick={() => {
                      setSelectedContentType(item.id);
                      setWorkspaceStarted(false);
                    }}
                  >
                    <span>{item.name}</span>
                    <small>{item.description}</small>
                  </button>
                  ))}
                </div>
                </div>

                <label className="brief-box">
              <span>选题 / 产品 / 素材</span>
              <textarea value={brief} onChange={(event) => setBrief(event.target.value)} />
                </label>
              </section>
            )}

            {workspaceStarted ? (
              <section className="workspace-panel">
            <div className="workspace-head">
              <div>
                <button className="back-button" onClick={returnToConsole}>
                  ← 返回控制台
                </button>
                <p className="eyebrow">生产区</p>
                <h2>
                  {platform.name} / {contentForm.name}生产页
                </h2>
              </div>
              <button className="secondary-action" onClick={returnToConsole}>
                重新选择
              </button>
            </div>

            {selectedContentType === "text" ? (
              <TextWorkspace
                article={article}
                copied={copied}
                gzhHtml={gzhHtml}
                platform={platform}
                selectedTheme={selectedTheme}
                themeId={themeId}
                writingSkillId={writingSkillId}
                writingMode={writingMode}
                onArticleChange={setArticle}
                onCopy={copyText}
                onThemeChange={setThemeId}
                onUseDraft={() => setArticle(articleDraft)}
                onWritingSkillChange={changeWritingSkill}
                onWritingModeChange={setWritingMode}
              />
            ) : null}

            {selectedContentType === "imageText" ? (
              <ImageTextWorkspace
                copied={copied}
                imageTextMode={imageTextMode}
                output={imageTextOutput}
                onCopy={copyText}
                onModeChange={setImageTextMode}
              />
            ) : null}

            {selectedContentType === "video" ? (
              <VideoWorkspace copied={copied} prompt={videoPrompt} onCopy={copyText} />
            ) : null}
              </section>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

function TextWorkspace({
  article,
  copied,
  gzhHtml,
  platform,
  selectedTheme,
  themeId,
  writingSkillId,
  writingMode,
  onArticleChange,
  onCopy,
  onThemeChange,
  onUseDraft,
  onWritingSkillChange,
  onWritingModeChange,
}: {
  article: string;
  copied: string;
  gzhHtml: string;
  platform: Platform;
  selectedTheme: GzhTheme;
  themeId: string;
  writingSkillId: WritingSkillId;
  writingMode: WritingMode;
  onArticleChange: (value: string) => void;
  onCopy: (key: string, value: string) => void;
  onThemeChange: (value: string) => void;
  onUseDraft: () => void;
  onWritingSkillChange: (value: WritingSkillId) => void;
  onWritingModeChange: (value: WritingMode) => void;
}) {
  const showSkillPicker = writingMode === "rewrite" && platform.id === "gongzhonghao";

  return (
    <div className="tool-grid">
      <aside className="tool-sidebar">
        <h3>文章生成方式</h3>
        <ModeButton
          active={writingMode === "article"}
          description="适合公众号、视频号长观点。"
          label="结构化长文"
          onClick={() => onWritingModeChange("article")}
        />
        <ModeButton
          active={writingMode === "shortNote"}
          description="适合小红书、快手短文。"
          label="短文笔记"
          onClick={() => onWritingModeChange("shortNote")}
        />
        <ModeButton
          active={writingMode === "rewrite"}
          description="把旧素材改成平台语言。"
          label="素材改写"
          onClick={() => onWritingModeChange("rewrite")}
        />
        {showSkillPicker ? (
          <div className="skill-picker">
            <span>改写 Skill</span>
            {writingSkills.map((skill) => (
              <button
                key={skill.id}
                className={skill.id === writingSkillId ? "skill-option active" : "skill-option"}
                onClick={() => onWritingSkillChange(skill.id)}
              >
                <strong>{skill.label}</strong>
                <small>{skill.description}</small>
              </button>
            ))}
          </div>
        ) : null}
        <button className="secondary-action full" onClick={onUseDraft}>
          使用当前方式生成初稿
        </button>
        <button className="secondary-action full" onClick={() => onCopy("article", article)}>
          {copied === "article" ? "已复制" : "复制文章"}
        </button>
      </aside>

      <section className="editor-card">
        <div className="editor-toolbar">
          <span>文章编辑</span>
          <button onClick={() => onCopy("gzh", gzhHtml)}>
            {copied === "gzh" ? "已复制" : "复制公众号 HTML"}
          </button>
        </div>
        <textarea
          className="long-editor"
          value={article}
          onChange={(event) => onArticleChange(event.target.value)}
        />
      </section>

      <section className="preview-card">
        <div className="editor-toolbar">
          <span>公众号排版预览</span>
          <button onClick={() => onCopy("gzh", gzhHtml)}>
            {copied === "gzh" ? "已复制" : "复制排版"}
          </button>
        </div>
        <div className="theme-tabs">
          {gzhThemes.map((theme) => (
            <button
              key={theme.id}
              className={theme.id === themeId ? "theme-tab active" : "theme-tab"}
              onClick={() => onThemeChange(theme.id)}
            >
              <span style={{ background: theme.primary }} />
              {theme.label}
            </button>
          ))}
        </div>
        <article
          className="wechat-preview"
          style={{ background: selectedTheme.paper }}
          dangerouslySetInnerHTML={{ __html: gzhHtml }}
        />
      </section>
    </div>
  );
}

function ImageTextWorkspace({
  copied,
  imageTextMode,
  output,
  onCopy,
  onModeChange,
}: {
  copied: string;
  imageTextMode: ImageTextMode;
  output: string;
  onCopy: (key: string, value: string) => void;
  onModeChange: (value: ImageTextMode) => void;
}) {
  return (
    <div className="tool-grid two-col">
      <aside className="tool-sidebar">
        <h3>图文生成方式</h3>
        <ModeButton
          active={imageTextMode === "cover"}
          description="封面标题、视觉结构、配色。"
          label="封面排版"
          onClick={() => onModeChange("cover")}
        />
        <ModeButton
          active={imageTextMode === "cards"}
          description="多页图文卡片分镜。"
          label="图文卡片"
          onClick={() => onModeChange("cards")}
        />
        <ModeButton
          active={imageTextMode === "imagePrompt"}
          description="给图像模型的配图提示词。"
          label="配图提示词"
          onClick={() => onModeChange("imagePrompt")}
        />
        <ModeButton
          active={imageTextMode === "guizangVisual"}
          description="文章转 PPT、封面、分享卡和图文节奏。"
          label="归藏视觉稿"
          onClick={() => onModeChange("guizangVisual")}
        />
        <div className="reserved-box">
          <strong>后续可接入</strong>
          <p>小红书封面生成、即梦/Seedream 图片 API、图片卡片模板渲染。</p>
        </div>
      </aside>
      <section className="output-card">
        <div className="editor-toolbar">
          <span>图文生成结果</span>
          <button onClick={() => onCopy("imageText", output)}>
            {copied === "imageText" ? "已复制" : "复制结果"}
          </button>
        </div>
        <pre>{output}</pre>
      </section>
    </div>
  );
}

function VideoWorkspace({
  copied,
  prompt,
  onCopy,
}: {
  copied: string;
  prompt: string;
  onCopy: (key: string, value: string) => void;
}) {
  return (
    <div className="tool-grid two-col">
      <aside className="tool-sidebar">
        <h3>视频生产链路</h3>
        <div className="step-list">
          <span className="done">1. 视频提示词</span>
          <span>2. 视频生成 API</span>
          <span>3. 成片下载 / 发布</span>
        </div>
        <div className="reserved-box">
          <strong>预留接口</strong>
          <p>后续接入 Seedance / Wan / 其他视频生成服务。当前先稳定产出可复制的视频提示词。</p>
        </div>
      </aside>
      <section className="output-card">
        <div className="editor-toolbar">
          <span>视频提示词</span>
          <button onClick={() => onCopy("video", prompt)}>
            {copied === "video" ? "已复制" : "复制提示词"}
          </button>
        </div>
        <pre>{prompt}</pre>
      </section>
    </div>
  );
}

function AdminApiWorkspace({
  adminError,
  form,
  providers,
  onAddProvider,
  onCapabilityChange,
  onFormChange,
}: {
  adminError: string;
  form: ProviderForm;
  providers: ApiProvider[];
  onAddProvider: () => void;
  onCapabilityChange: (capabilityId: string) => void;
  onFormChange: (value: ProviderForm) => void;
}) {
  return (
    <section className="admin-api-grid">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="eyebrow">Administrator</p>
            <h2>添加 API Provider</h2>
          </div>
          <p>后台维护 Key 和模型能力，创作页只使用已启用的能力。</p>
        </div>

        {adminError ? <p className="error-message">{adminError}</p> : null}

        <div className="provider-form-grid">
          <label>
            <span>名称</span>
            <input
              value={form.name}
              placeholder="例如 APIMart 内容 API"
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
            />
          </label>
          <label>
            <span>类型</span>
            <select
              value={form.providerType}
              onChange={(event) =>
                onFormChange({ ...form, providerType: event.target.value as ProviderType })
              }
            >
              {Object.entries(providerTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Base URL</span>
            <input
              value={form.baseUrl}
              placeholder="https://api.example.com/v1"
              onChange={(event) => onFormChange({ ...form, baseUrl: event.target.value })}
            />
          </label>
          <label>
            <span>API Key</span>
            <input
              value={form.apiKey}
              placeholder="仅后台保存，前台不展示"
              type="password"
              onChange={(event) => onFormChange({ ...form, apiKey: event.target.value })}
            />
          </label>
          <label>
            <span>模型名</span>
            <input
              value={form.modelName}
              placeholder="例如 gpt-5-content"
              onChange={(event) => onFormChange({ ...form, modelName: event.target.value })}
            />
          </label>
          <label>
            <span>备注</span>
            <input
              value={form.notes}
              placeholder="用途、成本、限制"
              onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
            />
          </label>
        </div>

        <fieldset className="capability-checks">
          <legend>适用能力</legend>
          {capabilityRegistry.map((capability) => (
            <label key={capability.id} className="check-row">
              <input
                checked={form.supportedCapabilityIds.includes(capability.id)}
                type="checkbox"
                onChange={() => onCapabilityChange(capability.id)}
              />
              <span>{capability.name}</span>
            </label>
          ))}
        </fieldset>

        <button className="primary-action admin-submit" onClick={onAddProvider}>
          添加 Provider
        </button>
      </section>

      <section className="admin-card provider-list-card">
        <div className="admin-card-head">
          <div>
            <p className="eyebrow">Provider 列表</p>
            <h2>后台 API 能力</h2>
          </div>
          <p>API Key 只显示脱敏信息。新增后立即进入本页列表。</p>
        </div>

        <div className="provider-list">
          {providers.map((provider) => (
            <article key={provider.id} className="provider-row">
              <div>
                <strong>{provider.name}</strong>
                <small>{provider.baseUrl}</small>
              </div>
              <span>{providerTypeLabels[provider.providerType]}</span>
              <span>{provider.modelName}</span>
              <span>{provider.maskedApiKey}</span>
              <small>{provider.supportedCapabilityIds.length} 个能力</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ModeButton({
  active,
  description,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "mode-button active" : "mode-button"} onClick={onClick}>
      <span>{label}</span>
      <small>{description}</small>
    </button>
  );
}
