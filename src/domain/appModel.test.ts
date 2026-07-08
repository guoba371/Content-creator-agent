import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bindCapabilityProviders,
  createApiProvider,
  createCreationTask,
  getCapabilitiesForTask,
  platformProfiles,
  runCapability,
} from "./appModel.ts";

describe("content creator domain model", () => {
  it("maps platform profiles and content forms to supported capabilities", () => {
    const xiaohongshuCapabilities = getCapabilitiesForTask({
      platformId: "xiaohongshu",
      contentForm: "imageText",
    });
    const douyinCapabilities = getCapabilitiesForTask({
      platformId: "douyin",
      contentForm: "video",
    });

    assert.ok(platformProfiles.xiaohongshu.contentPreferences.includes("种草感"));
    assert.ok(xiaohongshuCapabilities.map((capability) => capability.id).includes(
      "imageText.generate",
    ));
    assert.ok(douyinCapabilities.map((capability) => capability.id).includes(
      "video.prompt",
    ));
  });

  it("allows only administrators to add API providers", () => {
    assert.throws(() =>
      createApiProvider({
        actorRole: "creator",
        name: "Creator BYOK",
        providerType: "openai-compatible",
        baseUrl: "https://api.example.com/v1",
        apiKey: "sk-creator",
        modelName: "content-pro",
        supportedCapabilityIds: ["article.rewrite"],
      }),
    /Only administrators can manage API providers/);

    const provider = createApiProvider({
      actorRole: "administrator",
      name: "APIMart Content API",
      providerType: "openai-compatible",
      baseUrl: "https://api.apimart.local/v1",
      apiKey: "sk-live-admin-secret",
      modelName: "apimart-content-pro",
      supportedCapabilityIds: ["article.rewrite", "video.prompt"],
    });

    assert.equal(provider.status, "active");
    assert.equal(provider.maskedApiKey, "sk-live-admin-se...");
    assert.equal(provider.apiKey, undefined);
  });

  it("rejects provider bindings when the provider does not support the capability", () => {
    const provider = createApiProvider({
      actorRole: "administrator",
      name: "Article Writer Gateway",
      providerType: "openai-compatible",
      baseUrl: "https://writer.example.com/v1",
      apiKey: "sk-admin-writer-key",
      modelName: "writer-pro",
      supportedCapabilityIds: ["article.rewrite"],
    });

    assert.throws(() =>
      bindCapabilityProviders({
        actorRole: "administrator",
        capabilityId: "video.prompt",
        primaryProviderId: provider.id,
        providers: [provider],
      }),
    /Provider .* does not support capability video\.prompt/);
  });

  it("binds providers to capabilities and creates draft versions from mock runs", () => {
    const provider = createApiProvider({
      actorRole: "administrator",
      name: "Seedance Prompt Gateway",
      providerType: "video-generation",
      baseUrl: "https://video.example.com",
      apiKey: "vk-admin-key",
      modelName: "seedance-2-prompt",
      supportedCapabilityIds: ["video.prompt"],
    });
    const binding = bindCapabilityProviders({
      actorRole: "administrator",
      capabilityId: "video.prompt",
      primaryProviderId: provider.id,
      fallbackProviderIds: ["mock-remotion-provider"],
    });
    const task = createCreationTask({
      platformId: "douyin",
      contentForm: "video",
      topic: "GEO AI 搜索优化招商",
      sourceMaterials: [
        { type: "text", value: "8秒竖屏，红黄高对比，突出50%优惠" },
      ],
    });
    const nextDraft = runCapability({
      task,
      draft: task.drafts[0],
      capabilityId: "video.prompt",
      binding,
    });

    assert.deepEqual(binding.fallbackProviderIds, ["mock-remotion-provider"]);
    assert.equal(nextDraft.version, 2);
    assert.equal(nextDraft.parentDraftId, task.drafts[0].id);
    assert.ok(nextDraft.title.includes("抖音视频提示词"));
    assert.ok(nextDraft.body.includes("3秒钩子"));
  });
});
