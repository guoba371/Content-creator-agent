import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { writeRichHtmlClipboard } from "./clipboard.ts";

describe("rich HTML clipboard", () => {
  it("writes both HTML and plain text clipboard formats", async () => {
    const writes: Array<Array<{ data: Record<string, Blob> }>> = [];

    class FakeClipboardItem {
      data: Record<string, Blob>;

      constructor(data: Record<string, Blob>) {
        this.data = data;
      }
    }

    await writeRichHtmlClipboard("<section><strong>排版内容</strong></section>", "排版内容", {
      ClipboardItem: FakeClipboardItem,
      clipboard: {
        write: async (items) => {
          writes.push(items as Array<{ data: Record<string, Blob> }>);
        },
      },
      copySelection: () => false,
    });

    assert.equal(writes.length, 1);
    assert.deepEqual(Object.keys(writes[0][0].data).sort(), ["text/html", "text/plain"]);
    assert.equal(await writes[0][0].data["text/html"].text(), "<section><strong>排版内容</strong></section>");
    assert.equal(await writes[0][0].data["text/plain"].text(), "排版内容");
  });

  it("falls back to copying a rendered selection when rich clipboard writing fails", async () => {
    let selectedHtml = "";

    class FakeClipboardItem {
      constructor(_data: Record<string, Blob>) {}
    }

    await writeRichHtmlClipboard("<strong>排版内容</strong>", "排版内容", {
      ClipboardItem: FakeClipboardItem,
      clipboard: {
        write: async () => {
          throw new Error("Clipboard permission denied");
        },
      },
      copySelection: (html) => {
        selectedHtml = html;
        return true;
      },
    });

    assert.equal(selectedHtml, "<strong>排版内容</strong>");
  });
});
