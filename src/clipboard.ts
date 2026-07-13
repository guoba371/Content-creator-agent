type ClipboardItemLike = object;

type ClipboardItemConstructor = new (data: Record<string, Blob>) => ClipboardItemLike;

type RichClipboardDependencies = {
  ClipboardItem: ClipboardItemConstructor;
  clipboard: {
    write: (items: ClipboardItemLike[]) => Promise<void>;
  };
  copySelection: (html: string) => boolean;
};

const copyTextWithSelection = (value: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
};

const copyHtmlWithSelection = (html: string) => {
  const container = document.createElement("div");
  container.contentEditable = "true";
  container.innerHTML = html;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const range = document.createRange();
  range.selectNodeContents(container);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  const copied = document.execCommand("copy");
  selection?.removeAllRanges();
  container.remove();
  return copied;
};

export const writePlainTextClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    if (!copyTextWithSelection(value)) {
      throw new Error("Unable to copy text content");
    }
  }
};

export const writeRichHtmlClipboard = async (
  html: string,
  plainText: string,
  dependencies?: RichClipboardDependencies,
) => {
  if (
    !dependencies &&
    (typeof ClipboardItem === "undefined" || typeof navigator.clipboard?.write !== "function")
  ) {
    if (!copyHtmlWithSelection(html)) {
      throw new Error("Unable to copy rich HTML content");
    }
    return;
  }

  const resolved: RichClipboardDependencies = dependencies ?? {
    ClipboardItem: ClipboardItem as unknown as ClipboardItemConstructor,
    clipboard: {
      write: (items) => navigator.clipboard.write(items as ClipboardItem[]),
    },
    copySelection: copyHtmlWithSelection,
  };

  try {
    const item = new resolved.ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plainText], { type: "text/plain" }),
    });
    await resolved.clipboard.write([item]);
  } catch {
    if (!resolved.copySelection(html)) {
      throw new Error("Unable to copy rich HTML content");
    }
  }
};
