import { useMemo, useState } from "react";
import {
  capabilityRegistry,
  createApiProvider,
  createCreationTask,
  getCapabilitiesForTask,
  platformProfiles,
  runCapability,
  type ApiProvider,
  type Capability,
  type CapabilityBinding,
  type ContentDraft,
  type ContentForm,
  type CreationTask,
  type PlatformId,
  type ProviderType,
  type SourceMaterial,
  type SourceMaterialType,
} from "./domain/appModel.ts";
import {
  createInitialApiProviders,
  createInitialBindings,
  createInitialTasks,
} from "./mockData.ts";

type ViewMode = "workspace" | "admin";

type NewTaskForm = {
  platformId: PlatformId;
  contentForm: ContentForm;
  topic: string;
  sourceText: string;
  sourceLink: string;
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

const contentFormLabels: Record<ContentForm, string> = {
  article: "纯文章",
  imageText: "图文",
  video: "视频",
};

const sourceTypeLabels: Record<SourceMaterialType, string> = {
  text: "文本",
  image: "图片",
  link: "链接",
};

const providerTypeLabels: Record<ProviderType, string> = {
  "openai-compatible": "OpenAI 兼容",
  "image-generation": "图像生成",
  "video-generation": "视频生成",
  rendering: "渲染执行",
  "skill-runner": "Skill Runner",
};

const platformList = Object.values(platformProfiles);

const createInitialState = () => {
  const providers = createInitialApiProviders();

  return {
    providers,
    bindings: createInitialBindings(providers),
    tasks: createInitialTasks(),
  };
};

export function App() {
  const initialState = useMemo(createInitialState, []);
  const [viewMode, setViewMode] = useState<ViewMode>("workspace");
  const [providers, setProviders] = useState<ApiProvider[]>(initialState.providers);
  const [bindings, setBindings] = useState<CapabilityBinding[]>(initialState.bindings);
  const [tasks, setTasks] = useState<CreationTask[]>(initialState.tasks);
  const [selectedTaskId, setSelectedTaskId] = useState(initialState.tasks[0]?.id ?? "");
  const [selectedDraftId, setSelectedDraftId] = useState(
    initialState.tasks[0]?.drafts[0]?.id ?? "",
  );
  const [newTask, setNewTask] = useState<NewTaskForm>({
    platformId: "xiaohongshu",
    contentForm: "imageText",
    topic: "GEO AI 搜索优化招商",
    sourceText: "8秒竖屏，红黄高对比，突出首月合作优惠最高50%",
    sourceLink: "",
  });
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

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];
  const selectedDraft =
    selectedTask?.drafts.find((draft) => draft.id === selectedDraftId) ??
    selectedTask?.drafts.at(-1);
  const selectedPlatform = selectedTask
    ? platformProfiles[selectedTask.platformId]
    : platformProfiles.xiaohongshu;
  const availableCapabilities = selectedTask
    ? getCapabilitiesForTask({
        platformId: selectedTask.platformId,
        contentForm: selectedTask.contentForm,
      })
    : [];

  const handleCreateTask = () => {
    const sourceMaterials: SourceMaterial[] = [];

    if (newTask.sourceText.trim()) {
      sourceMaterials.push({ type: "text", value: newTask.sourceText.trim() });
    }

    if (newTask.sourceLink.trim()) {
      sourceMaterials.push({ type: "link", value: newTask.sourceLink.trim() });
    }

    const task = createCreationTask({
      platformId: newTask.platformId,
      contentForm: newTask.contentForm,
      topic: newTask.topic.trim() || "未命名选题",
      sourceMaterials,
    });

    setTasks((current) => [task, ...current]);
    setSelectedTaskId(task.id);
    setSelectedDraftId(task.drafts[0].id);
  };

  const handleRunCapability = (capability: Capability) => {
    if (!selectedTask || !selectedDraft) {
      return;
    }

    const binding = bindings.find((item) => item.capabilityId === capability.id);
    const nextDraft = runCapability({
      task: selectedTask,
      draft: selectedDraft,
      capabilityId: capability.id,
      binding,
    });

    setTasks((current) =>
      current.map((task) =>
        task.id === selectedTask.id
          ? { ...task, drafts: [...task.drafts, nextDraft] }
          : task,
      ),
    );
    setSelectedDraftId(nextDraft.id);
  };

  const handleAddProvider = () => {
    setAdminError("");

    if (!providerForm.name.trim() || !providerForm.baseUrl.trim() || !providerForm.apiKey.trim()) {
      setAdminError("请填写名称、Base URL 和 API Key。");
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
      setBindings((current) => {
        const existingCapabilityIds = new Set(current.map((binding) => binding.capabilityId));
        const newBindings = provider.supportedCapabilityIds
          .filter((capabilityId) => !existingCapabilityIds.has(capabilityId))
          .map((capabilityId) => ({
            capabilityId,
            primaryProviderId: provider.id,
            fallbackProviderIds: [],
          }));

        return [...current, ...newBindings];
      });
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
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="kicker">Content Creator Agent</p>
          <h1>多平台内容生产工作台</h1>
        </div>
        <nav className="view-tabs" aria-label="主视图">
          <button
            className={viewMode === "workspace" ? "tab active" : "tab"}
            onClick={() => setViewMode("workspace")}
          >
            创作工作台
          </button>
          <button
            className={viewMode === "admin" ? "tab active" : "tab"}
            onClick={() => setViewMode("admin")}
          >
            后台 API
          </button>
        </nav>
      </header>

      {viewMode === "workspace" ? (
        <main className="workspace-grid">
          <aside className="panel sidebar" aria-label="任务列表">
            <SectionTitle title="创作任务" description="一次任务只对应一个平台和一个内容形态。" />
            <TaskComposer
              form={newTask}
              onChange={setNewTask}
              onCreate={handleCreateTask}
            />
            <div className="task-list">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  className={task.id === selectedTask?.id ? "task-item active" : "task-item"}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setSelectedDraftId(task.drafts.at(-1)?.id ?? "");
                  }}
                >
                  <span>{task.topic}</span>
                  <small>
                    {platformProfiles[task.platformId].name} ·{" "}
                    {contentFormLabels[task.contentForm]} · {task.drafts.length} 版
                  </small>
                </button>
              ))}
            </div>
          </aside>

          <section className="panel editor-panel" aria-label="草稿编辑">
            {selectedTask && selectedDraft ? (
              <DraftEditor
                task={selectedTask}
                draft={selectedDraft}
                onDraftBodyChange={(body) => {
                  setTasks((current) =>
                    current.map((task) =>
                      task.id === selectedTask.id
                        ? {
                            ...task,
                            drafts: task.drafts.map((draft) =>
                              draft.id === selectedDraft.id ? { ...draft, body } : draft,
                            ),
                          }
                        : task,
                    ),
                  );
                }}
              />
            ) : (
              <EmptyState title="还没有任务" body="先创建一个平台和内容形态明确的创作任务。" />
            )}
          </section>

          <aside className="panel insight-panel" aria-label="平台和能力">
            <PlatformProfilePanel profile={selectedPlatform} />
            <CapabilityPanel
              capabilities={availableCapabilities}
              bindings={bindings}
              providers={providers}
              onRun={handleRunCapability}
            />
            {selectedTask && selectedDraft ? (
              <VersionHistory
                drafts={selectedTask.drafts}
                selectedDraftId={selectedDraft.id}
                onSelect={setSelectedDraftId}
              />
            ) : null}
          </aside>
        </main>
      ) : (
        <AdminPanel
          providers={providers}
          bindings={bindings}
          form={providerForm}
          error={adminError}
          onFormChange={setProviderForm}
          onAddProvider={handleAddProvider}
        />
      )}
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function TaskComposer({
  form,
  onChange,
  onCreate,
}: {
  form: NewTaskForm;
  onChange: (form: NewTaskForm) => void;
  onCreate: () => void;
}) {
  return (
    <div className="composer">
      <label>
        <span>平台</span>
        <select
          value={form.platformId}
          onChange={(event) =>
            onChange({ ...form, platformId: event.target.value as PlatformId })
          }
        >
          {platformList.map((platform) => (
            <option key={platform.id} value={platform.id}>
              {platform.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>内容形态</span>
        <select
          value={form.contentForm}
          onChange={(event) =>
            onChange({ ...form, contentForm: event.target.value as ContentForm })
          }
        >
          {Object.entries(contentFormLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>选题</span>
        <input
          value={form.topic}
          onChange={(event) => onChange({ ...form, topic: event.target.value })}
          placeholder="输入选题或产品需求"
        />
      </label>
      <label>
        <span>文本素材</span>
        <textarea
          value={form.sourceText}
          onChange={(event) => onChange({ ...form, sourceText: event.target.value })}
          placeholder="卖点、旧文案、截图描述、视频要求"
          rows={4}
        />
      </label>
      <label>
        <span>链接素材</span>
        <input
          value={form.sourceLink}
          onChange={(event) => onChange({ ...form, sourceLink: event.target.value })}
          placeholder="竞品链接或参考页面"
        />
      </label>
      <button className="primary-button" onClick={onCreate}>
        新建任务
      </button>
    </div>
  );
}

function DraftEditor({
  task,
  draft,
  onDraftBodyChange,
}: {
  task: CreationTask;
  draft: ContentDraft;
  onDraftBodyChange: (body: string) => void;
}) {
  const profile = platformProfiles[task.platformId];

  return (
    <div className="draft-editor">
      <div className="editor-head">
        <div>
          <p className="kicker">当前草稿</p>
          <h2>{draft.title}</h2>
        </div>
        <div className="draft-meta">
          <span>{profile.name}</span>
          <span>{contentFormLabels[task.contentForm]}</span>
          <span>版本 {draft.version}</span>
        </div>
      </div>
      <div className="source-strip">
        {task.sourceMaterials.length ? (
          task.sourceMaterials.map((material, index) => (
            <span key={`${material.type}-${index}`}>
              {sourceTypeLabels[material.type]}: {material.value}
            </span>
          ))
        ) : (
          <span>暂无素材</span>
        )}
      </div>
      <label className="editor-label" htmlFor="draft-body">
        草稿内容
      </label>
      <textarea
        id="draft-body"
        className="draft-textarea"
        value={draft.body}
        onChange={(event) => onDraftBodyChange(event.target.value)}
      />
      <div className="export-row">
        <button className="secondary-button">复制当前草稿</button>
        <button className="secondary-button">导出 Markdown</button>
      </div>
    </div>
  );
}

function PlatformProfilePanel({ profile }: { profile: (typeof platformProfiles)[PlatformId] }) {
  return (
    <section className="stack-block">
      <SectionTitle title={`${profile.name}画像`} description={profile.audienceExpectation} />
      <div className="chip-row">
        {profile.contentPreferences.map((preference) => (
          <span className="chip" key={preference}>
            {preference}
          </span>
        ))}
      </div>
      <div className="profile-lines">
        <p>
          <strong>节奏</strong>
          {profile.rhythm}
        </p>
        <p>
          <strong>约束</strong>
          {profile.publishingConstraints.join("、")}
        </p>
      </div>
    </section>
  );
}

function CapabilityPanel({
  capabilities,
  bindings,
  providers,
  onRun,
}: {
  capabilities: Capability[];
  bindings: CapabilityBinding[];
  providers: ApiProvider[];
  onRun: (capability: Capability) => void;
}) {
  return (
    <section className="stack-block">
      <SectionTitle title="可用能力" description="Creator 只看到能力，不接触 API Key。" />
      <div className="capability-list">
        {capabilities.map((capability) => {
          const binding = bindings.find((item) => item.capabilityId === capability.id);
          const provider = providers.find((item) => item.id === binding?.primaryProviderId);

          return (
            <button
              key={capability.id}
              className="capability-item"
              onClick={() => onRun(capability)}
            >
              <span>{capability.name}</span>
              <small>{provider?.name ?? "Mock Provider"}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function VersionHistory({
  drafts,
  selectedDraftId,
  onSelect,
}: {
  drafts: ContentDraft[];
  selectedDraftId: string;
  onSelect: (draftId: string) => void;
}) {
  return (
    <section className="stack-block">
      <SectionTitle title="草稿版本" description="每次能力运行都会生成新版本。" />
      <div className="version-list">
        {drafts.map((draft) => (
          <button
            key={draft.id}
            className={draft.id === selectedDraftId ? "version-item active" : "version-item"}
            onClick={() => onSelect(draft.id)}
          >
            <span>版本 {draft.version}</span>
            <small>{draft.title}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function AdminPanel({
  providers,
  bindings,
  form,
  error,
  onFormChange,
  onAddProvider,
}: {
  providers: ApiProvider[];
  bindings: CapabilityBinding[];
  form: ProviderForm;
  error: string;
  onFormChange: (form: ProviderForm) => void;
  onAddProvider: () => void;
}) {
  return (
    <main className="admin-grid">
      <section className="panel admin-form">
        <SectionTitle
          title="添加 API Provider"
          description="只有 Administrator 能维护 API Key，Creator 使用后台启用的能力。"
        />
        {error ? <p className="error-message">{error}</p> : null}
        <div className="form-grid">
          <label>
            <span>名称</span>
            <input
              value={form.name}
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
              placeholder="例如 APIMart 内容 API"
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
              onChange={(event) => onFormChange({ ...form, baseUrl: event.target.value })}
              placeholder="https://api.example.com/v1"
            />
          </label>
          <label>
            <span>API Key</span>
            <input
              type="password"
              value={form.apiKey}
              onChange={(event) => onFormChange({ ...form, apiKey: event.target.value })}
              placeholder="仅后台保存，前台不展示"
            />
          </label>
          <label>
            <span>模型名</span>
            <input
              value={form.modelName}
              onChange={(event) => onFormChange({ ...form, modelName: event.target.value })}
              placeholder="例如 gpt-5-content"
            />
          </label>
          <label>
            <span>备注</span>
            <input
              value={form.notes}
              onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
              placeholder="用途、成本、限制"
            />
          </label>
        </div>
        <fieldset className="capability-checks">
          <legend>适用能力</legend>
          {capabilityRegistry.map((capability) => (
            <label key={capability.id} className="check-row">
              <input
                type="checkbox"
                checked={form.supportedCapabilityIds.includes(capability.id)}
                onChange={(event) => {
                  const nextIds = event.target.checked
                    ? [...form.supportedCapabilityIds, capability.id]
                    : form.supportedCapabilityIds.filter((id) => id !== capability.id);
                  onFormChange({ ...form, supportedCapabilityIds: nextIds });
                }}
              />
              <span>{capability.name}</span>
            </label>
          ))}
        </fieldset>
        <button className="primary-button" onClick={onAddProvider}>
          添加 Provider
        </button>
      </section>

      <section className="panel">
        <SectionTitle title="Provider 列表" description="API Key 只显示脱敏信息。" />
        <div className="provider-table">
          {providers.map((provider) => (
            <article className="provider-row" key={provider.id}>
              <div>
                <h3>{provider.name}</h3>
                <p>{provider.baseUrl}</p>
              </div>
              <span>{providerTypeLabels[provider.providerType]}</span>
              <span>{provider.modelName}</span>
              <span>{provider.maskedApiKey}</span>
              <span className={provider.status === "active" ? "status active" : "status"}>
                {provider.status === "active" ? "启用" : "停用"}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel binding-panel">
        <SectionTitle title="能力绑定" description="一个能力可配置主 Provider 和备用 Provider。" />
        <div className="binding-list">
          {bindings.map((binding) => {
            const capability = capabilityRegistry.find((item) => item.id === binding.capabilityId);
            const provider = providers.find((item) => item.id === binding.primaryProviderId);

            return (
              <article className="binding-row" key={binding.capabilityId}>
                <div>
                  <h3>{capability?.name ?? binding.capabilityId}</h3>
                  <p>{capability?.description}</p>
                </div>
                <div>
                  <strong>{provider?.name ?? binding.primaryProviderId}</strong>
                  <small>
                    备用:{" "}
                    {binding.fallbackProviderIds.length
                      ? binding.fallbackProviderIds.join("、")
                      : "暂无"}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
