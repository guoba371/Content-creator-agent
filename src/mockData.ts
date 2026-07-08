import {
  bindCapabilityProviders,
  createApiProvider,
  createCreationTask,
  type ApiProvider,
  type CapabilityBinding,
  type CreationTask,
} from "./domain/appModel.ts";

export const createInitialApiProviders = (): ApiProvider[] => [
  createApiProvider({
    actorRole: "administrator",
    name: "APIMart 提示词网关",
    providerType: "openai-compatible",
    baseUrl: "https://api.apimart.example/v1",
    apiKey: "sk-apimart-admin-key",
    modelName: "apimart-content-pro",
    supportedCapabilityIds: ["article.rewrite", "imageText.generate", "video.prompt"],
    notes: "参考 APIMart-image-Agent 的提示词生成能力。",
  }),
  createApiProvider({
    actorRole: "administrator",
    name: "HyperFrames 本地渲染",
    providerType: "rendering",
    baseUrl: "local://hyperframes",
    apiKey: "hf-local-admin-key",
    modelName: "hyperframes-cli",
    supportedCapabilityIds: ["video.render.hyperframes"],
    notes: "用于后续 HTML 视频合成和渲染。",
  }),
];

export const createInitialBindings = (providers: ApiProvider[]): CapabilityBinding[] => {
  const promptProvider = providers[0];
  const renderProvider = providers[1];

  return [
    bindCapabilityProviders({
      actorRole: "administrator",
      capabilityId: "article.rewrite",
      primaryProviderId: promptProvider.id,
      fallbackProviderIds: [],
    }),
    bindCapabilityProviders({
      actorRole: "administrator",
      capabilityId: "imageText.generate",
      primaryProviderId: promptProvider.id,
      fallbackProviderIds: [],
    }),
    bindCapabilityProviders({
      actorRole: "administrator",
      capabilityId: "video.prompt",
      primaryProviderId: promptProvider.id,
      fallbackProviderIds: [],
    }),
    bindCapabilityProviders({
      actorRole: "administrator",
      capabilityId: "video.render.hyperframes",
      primaryProviderId: renderProvider.id,
      fallbackProviderIds: ["mock-remotion-provider"],
    }),
  ];
};

export const createInitialTasks = (): CreationTask[] => [
  createCreationTask({
    platformId: "xiaohongshu",
    contentForm: "imageText",
    topic: "GEO AI 搜索优化招商",
    sourceMaterials: [
      { type: "text", value: "8秒竖屏，红黄高对比，突出首月合作优惠最高50%" },
      { type: "link", value: "https://apimart-image-agent.1326156839.workers.dev/" },
    ],
  }),
  createCreationTask({
    platformId: "douyin",
    contentForm: "video",
    topic: "Seedance 2.0 视频提示词库",
    sourceMaterials: [
      { type: "text", value: "输入一个产品或需求，生成分镜、节奏、音效和限制词。" },
    ],
  }),
  createCreationTask({
    platformId: "gongzhonghao",
    contentForm: "article",
    topic: "内容团队如何把平台适配做成系统",
    sourceMaterials: [
      { type: "text", value: "平台画像、能力注册表、草稿版本和管理员 API Provider。" },
    ],
  }),
];
