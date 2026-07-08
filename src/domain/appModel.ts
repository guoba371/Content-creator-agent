export type UserRole = "creator" | "administrator";
export type PlatformId =
  | "xiaohongshu"
  | "douyin"
  | "shipinhao"
  | "gongzhonghao"
  | "kuaishou";
export type ContentForm = "article" | "imageText" | "video";
export type SourceMaterialType = "text" | "image" | "link";
export type ProviderType =
  | "openai-compatible"
  | "image-generation"
  | "video-generation"
  | "rendering"
  | "skill-runner";
export type ProviderStatus = "active" | "disabled";

export type SourceMaterial = {
  type: SourceMaterialType;
  value: string;
};

export type PlatformProfile = {
  id: PlatformId;
  name: string;
  contentPreferences: string[];
  rhythm: string;
  audienceExpectation: string;
  publishingConstraints: string[];
};

export type Capability = {
  id: string;
  name: string;
  contentForms: ContentForm[];
  platformIds: PlatformId[];
  description: string;
};

export type ApiProvider = {
  id: string;
  name: string;
  providerType: ProviderType;
  baseUrl: string;
  modelName: string;
  supportedCapabilityIds: string[];
  status: ProviderStatus;
  maskedApiKey: string;
  notes?: string;
  apiKey?: never;
};

export type CreateApiProviderInput = {
  actorRole: UserRole;
  name: string;
  providerType: ProviderType;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  supportedCapabilityIds: string[];
  status?: ProviderStatus;
  notes?: string;
};

export type CapabilityBinding = {
  capabilityId: string;
  primaryProviderId: string;
  fallbackProviderIds: string[];
};

export type BindCapabilityProvidersInput = {
  actorRole: UserRole;
  capabilityId: string;
  primaryProviderId: string;
  fallbackProviderIds?: string[];
  providers?: ApiProvider[];
};

export type ContentDraft = {
  id: string;
  taskId: string;
  version: number;
  title: string;
  body: string;
  parentDraftId?: string;
};

export type CreationTask = {
  id: string;
  platformId: PlatformId;
  contentForm: ContentForm;
  topic: string;
  sourceMaterials: SourceMaterial[];
  drafts: ContentDraft[];
};

export type CreateCreationTaskInput = {
  platformId: PlatformId;
  contentForm: ContentForm;
  topic: string;
  sourceMaterials: SourceMaterial[];
};

export const platformProfiles: Record<PlatformId, PlatformProfile> = {
  xiaohongshu: {
    id: "xiaohongshu",
    name: "小红书",
    contentPreferences: ["种草感", "强标题", "情绪价值", "短分段", "标签友好"],
    rhythm: "开头抓痛点，中段给体验，结尾引导收藏和评论。",
    audienceExpectation: "用户希望看到真实体验、可复制步骤和明确收益。",
    publishingConstraints: ["标题要强", "正文要轻", "标签要可控"],
  },
  douyin: {
    id: "douyin",
    name: "抖音",
    contentPreferences: ["3秒钩子", "口播节奏", "镜头脚本", "反差开场"],
    rhythm: "前3秒建立冲突，中段高频信息，结尾给行动指令。",
    audienceExpectation: "用户希望快速判断是否值得继续看。",
    publishingConstraints: ["竖屏优先", "节奏强", "镜头点明确"],
  },
  shipinhao: {
    id: "shipinhao",
    name: "视频号",
    contentPreferences: ["可信表达", "知识结构", "观点沉淀", "私域转发"],
    rhythm: "先给判断，再给理由，最后给可转发的总结。",
    audienceExpectation: "用户希望内容稳重、可信、适合转给熟人。",
    publishingConstraints: ["表达克制", "观点清晰", "避免过度夸张"],
  },
  gongzhonghao: {
    id: "gongzhonghao",
    name: "公众号",
    contentPreferences: ["长文结构", "论证深度", "小标题", "摘要"],
    rhythm: "标题给承诺，摘要给判断，正文分层展开。",
    audienceExpectation: "用户希望获得完整解释、案例和可保存观点。",
    publishingConstraints: ["结构完整", "段落清楚", "标题摘要可独立阅读"],
  },
  kuaishou: {
    id: "kuaishou",
    name: "快手",
    contentPreferences: ["真实感", "生活化", "直接表达", "强场景"],
    rhythm: "直接进入场景，用朴素语言说明问题和结果。",
    audienceExpectation: "用户希望内容真实、接地气、有明确场景。",
    publishingConstraints: ["少包装", "重场景", "强人设"],
  },
};

export const capabilityRegistry: Capability[] = [
  {
    id: "article.draft",
    name: "生成文章初稿",
    contentForms: ["article"],
    platformIds: ["xiaohongshu", "gongzhonghao", "shipinhao", "kuaishou"],
    description: "根据平台画像和素材生成文章草稿。",
  },
  {
    id: "article.rewrite",
    name: "文章改写",
    contentForms: ["article"],
    platformIds: ["xiaohongshu", "gongzhonghao", "shipinhao", "kuaishou"],
    description: "参考 khazix-writer 与去 AI 味技能改写文章。",
  },
  {
    id: "article.humanize",
    name: "去 AI 味",
    contentForms: ["article", "imageText"],
    platformIds: ["xiaohongshu", "gongzhonghao", "shipinhao", "kuaishou"],
    description: "降低模板感，增强中文自然表达。",
  },
  {
    id: "imageText.generate",
    name: "生成图文",
    contentForms: ["imageText"],
    platformIds: ["xiaohongshu", "kuaishou", "shipinhao"],
    description: "生成图文结构、封面方向、配图提示词和正文。",
  },
  {
    id: "video.prompt",
    name: "生成视频提示词",
    contentForms: ["video"],
    platformIds: ["douyin", "shipinhao", "kuaishou", "xiaohongshu"],
    description: "生成镜头脚本、节奏、音效和模型提示词。",
  },
  {
    id: "video.render.hyperframes",
    name: "HyperFrames 成片",
    contentForms: ["video"],
    platformIds: ["douyin", "shipinhao", "kuaishou", "xiaohongshu"],
    description: "将视频提示词包和素材交给 HyperFrames 渲染。",
  },
  {
    id: "video.render.remotion",
    name: "Remotion 成片",
    contentForms: ["video"],
    platformIds: ["douyin", "shipinhao", "kuaishou", "xiaohongshu"],
    description: "将视频提示词包和素材交给 Remotion 渲染。",
  },
  {
    id: "video.render.external",
    name: "外部视频 API",
    contentForms: ["video"],
    platformIds: ["douyin", "shipinhao", "kuaishou", "xiaohongshu"],
    description: "将视频提示词包发送给外部视频生成服务。",
  },
];

let idSequence = 0;

const nextId = (prefix: string) => `${prefix}-${++idSequence}`;

const requireAdministrator = (actorRole: UserRole) => {
  if (actorRole !== "administrator") {
    throw new Error("Only administrators can manage API providers");
  }
};

const maskApiKey = (apiKey: string) => {
  if (apiKey.length <= 8) {
    return "********";
  }

  return `${apiKey.slice(0, 16)}...`;
};

export const getCapabilitiesForTask = ({
  platformId,
  contentForm,
}: {
  platformId: PlatformId;
  contentForm: ContentForm;
}) =>
  capabilityRegistry.filter(
    (capability) =>
      capability.contentForms.includes(contentForm) &&
      capability.platformIds.includes(platformId),
  );

export const createApiProvider = ({
  actorRole,
  name,
  providerType,
  baseUrl,
  apiKey,
  modelName,
  supportedCapabilityIds,
  status = "active",
  notes,
}: CreateApiProviderInput): ApiProvider => {
  requireAdministrator(actorRole);

  return {
    id: nextId("provider"),
    name,
    providerType,
    baseUrl,
    modelName,
    supportedCapabilityIds,
    status,
    maskedApiKey: maskApiKey(apiKey),
    notes,
  };
};

export const bindCapabilityProviders = ({
  actorRole,
  capabilityId,
  primaryProviderId,
  fallbackProviderIds = [],
  providers,
}: BindCapabilityProvidersInput): CapabilityBinding => {
  requireAdministrator(actorRole);
  assertProviderSupportsCapability({ providers, providerId: primaryProviderId, capabilityId });
  fallbackProviderIds.forEach((providerId) => {
    assertProviderSupportsCapability({ providers, providerId, capabilityId });
  });

  return {
    capabilityId,
    primaryProviderId,
    fallbackProviderIds,
  };
};

const assertProviderSupportsCapability = ({
  providers,
  providerId,
  capabilityId,
}: {
  providers?: ApiProvider[];
  providerId: string;
  capabilityId: string;
}) => {
  if (!providers) {
    return;
  }

  const provider = providers.find((item) => item.id === providerId);

  if (!provider) {
    throw new Error(`Provider ${providerId} is not available`);
  }

  if (!provider.supportedCapabilityIds.includes(capabilityId)) {
    throw new Error(`Provider ${provider.name} does not support capability ${capabilityId}`);
  }
};

export const createCreationTask = ({
  platformId,
  contentForm,
  topic,
  sourceMaterials,
}: CreateCreationTaskInput): CreationTask => {
  const taskId = nextId("task");
  const platform = platformProfiles[platformId];
  const firstDraft: ContentDraft = {
    id: nextId("draft"),
    taskId,
    version: 1,
    title: `${platform.name} ${labelContentForm(contentForm)}初稿`,
    body: buildInitialDraftBody({ platform, contentForm, topic, sourceMaterials }),
  };

  return {
    id: taskId,
    platformId,
    contentForm,
    topic,
    sourceMaterials,
    drafts: [firstDraft],
  };
};

export const runCapability = ({
  task,
  draft,
  capabilityId,
  binding,
}: {
  task: CreationTask;
  draft: ContentDraft;
  capabilityId: string;
  binding?: CapabilityBinding;
}): ContentDraft => {
  const platform = platformProfiles[task.platformId];
  const nextVersion = Math.max(...task.drafts.map((item) => item.version)) + 1;

  return {
    id: nextId("draft"),
    taskId: task.id,
    version: nextVersion,
    parentDraftId: draft.id,
    title: buildCapabilityTitle({ platform, capabilityId }),
    body: buildCapabilityBody({ task, draft, platform, capabilityId, binding }),
  };
};

const labelContentForm = (contentForm: ContentForm) => {
  const labels: Record<ContentForm, string> = {
    article: "文章",
    imageText: "图文",
    video: "视频",
  };

  return labels[contentForm];
};

const buildInitialDraftBody = ({
  platform,
  contentForm,
  topic,
  sourceMaterials,
}: {
  platform: PlatformProfile;
  contentForm: ContentForm;
  topic: string;
  sourceMaterials: SourceMaterial[];
}) => {
  const materials = sourceMaterials
    .map((material) => `- ${material.type}: ${material.value}`)
    .join("\n");

  return [
    `选题: ${topic}`,
    `平台: ${platform.name}`,
    `内容形态: ${labelContentForm(contentForm)}`,
    `平台偏好: ${platform.contentPreferences.join("、")}`,
    "素材:",
    materials || "- 暂无素材",
  ].join("\n");
};

const buildCapabilityTitle = ({
  platform,
  capabilityId,
}: {
  platform: PlatformProfile;
  capabilityId: string;
}) => {
  if (capabilityId === "video.prompt") {
    return `${platform.name}视频提示词`;
  }

  const capability = capabilityRegistry.find((item) => item.id === capabilityId);
  return `${platform.name}${capability?.name ?? "能力输出"}`;
};

const buildCapabilityBody = ({
  task,
  draft,
  platform,
  capabilityId,
  binding,
}: {
  task: CreationTask;
  draft: ContentDraft;
  platform: PlatformProfile;
  capabilityId: string;
  binding?: CapabilityBinding;
}) => {
  if (capabilityId === "video.prompt") {
    return [
      `平台: ${platform.name}`,
      `主题: ${task.topic}`,
      "镜头结构:",
      "1. 3秒钩子: 用强对比画面展示痛点和利益点。",
      "2. 主体节奏: 每2秒切换一次信息点，保持竖屏快节奏。",
      "3. 行动收束: 用一句明确口播引导咨询或收藏。",
      "视频提示词:",
      `${task.topic}，竖屏短视频，高对比视觉，清晰产品利益点，强节奏剪辑，真实商业场景，字幕突出核心优惠。`,
      "限制词:",
      "避免低清画面、混乱字幕、夸张虚假承诺、无关人物。",
      `Provider: ${binding?.primaryProviderId ?? "mock-provider"}`,
    ].join("\n");
  }

  if (capabilityId === "imageText.generate") {
    return [
      `平台: ${platform.name}`,
      `主题: ${task.topic}`,
      "图文结构:",
      "封面: 高对比标题 + 明确利益点。",
      "正文: 痛点、解决方案、场景证明、行动提示。",
      "配图提示词: 真实产品场景，清晰主体，平台原生审美。",
      `参考草稿:\n${draft.body}`,
    ].join("\n");
  }

  return [
    `平台: ${platform.name}`,
    `主题: ${task.topic}`,
    `能力: ${capabilityRegistry.find((item) => item.id === capabilityId)?.name ?? capabilityId}`,
    "输出:",
    `${draft.body}\n\n已按平台画像强化表达，保留事实，减少模板感。`,
  ].join("\n");
};
