# Content Creator Agent

Content Creator Agent is a Chinese content production workspace for turning a creator's topic, source material, and intent into platform-adapted publishing drafts.

## Language

**Content Production Workspace**:
A SaaS workspace where creators plan, generate, adapt, and prepare content for different Chinese content platforms.
_Avoid_: AI skill launcher, model launcher, generator collection

**Creator**:
A workspace user who creates and edits content using available platforms, content forms, source material, drafts, and capabilities.
_Avoid_: Administrator, API owner

**Administrator**:
A workspace operator who manages API providers, capability availability, and system-level settings for the SaaS.
_Avoid_: Creator, end user

**Platform**:
A publishing destination with its own audience expectations, content preferences, and format constraints.
_Avoid_: Channel, generic destination

**Platform Profile**:
A platform's content preference model, including tone, structure, rhythm, audience expectations, and publishing constraints.
_Avoid_: Prompt snippet, hard-coded platform rules

**Content Form**:
The intended output family for a creation task: article, image-text post, or video.
_Avoid_: Format, media type

**Creation Task**:
A single content production request for one platform and one content form.
_Avoid_: Job, generation request, multi-platform campaign

**Source Material**:
Input material that grounds a creation task, such as creator notes, product details, images, links, screenshots, or existing content.
_Avoid_: Attachment, upload, prompt input

**Content Draft**:
An editable output version produced within a creation task, such as an article draft, image-text plan, rewritten variant, or video prompt package.
_Avoid_: Final publication, generation response

**Capability**:
A named creative operation the workspace can apply to a creation task or content draft, such as rewriting an article, generating image-text content, creating a video prompt package, or producing a video.
_Avoid_: External tool, model, skill

**Capability Registry**:
The workspace's catalog of available capabilities and the content forms they support.
_Avoid_: Tool list, prompt collection

**API Provider**:
An administrator-managed third-party service configuration that can power one or more capabilities.
_Avoid_: User API key, environment variable, loose integration

**Capability Binding**:
An administrator-managed rule that connects a capability to one or more API providers, including primary and fallback provider choices.
_Avoid_: One-off integration, hard-coded provider

**Platform-Adapted Content**:
A draft shaped for a specific platform's tone, structure, rhythm, and publishing expectations.
_Avoid_: Generic content, one-size-fits-all draft

**Video Prompt Package**:
A video-ready planning output that includes prompt text, shot structure, rhythm, audio guidance, and generation constraints for a video creation tool.
_Avoid_: Final video, raw prompt

**Video Production**:
The step that turns a video prompt package and optional source assets into a rendered or externally generated video.
_Avoid_: Video prompt generation, script drafting
