const extensionAPI = globalThis.browser || globalThis.chrome;

if (!extensionAPI) {
  throw new Error("Extension API is not available in this environment.");
}

let savedSelection = null;

extensionAPI.runtime.onMessage.addListener((message) => {
  if (message.type === "STRETCH\_ERROR") {
    showToast(message.message);
    return;
  }

  if (message.type !== "STRETCH\_RESULT" || !savedSelection) return;

  const { range, original } = savedSelection;

  // A page may change while the API request is running.
  if (!range.startContainer.isConnected || !range.endContainer.isConnected) {
    showToast("The selected page text changed. Select it again and retry.");
    return;
  }

  const replacement = document.createElement("span");
  replacement.textContent = message.shortened;
  replacement.title = "Click to expand";
  replacement.setAttribute("role", "button");
  replacement.tabIndex = 0;
  replacement.style.cssText =
    "background:#fff3b0;border-bottom:1px dotted #665500;cursor:pointer;";

  const expand = () => {
    replacement.replaceWith(document.createTextNode(original));
  };

  replacement.addEventListener("click", expand, { once: true });
  replacement.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      expand();
    }
  }, { once: true });

  try {
    range.deleteContents();
    range.insertNode(replacement);
    savedSelection = null;
  } catch {
    showToast("Could not replace that text on this page.");
  }
});

extensionAPI.runtime.onMessage.addListener((message) => {
  if (message.type !== "STRETCH\_RESULT") return;

  // Selection may no longer be active after opening the context menu.
  // The original range is captured by the selectionchange handler below.
});

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return;

  const range = selection.getRangeAt(0).cloneRange();
  const original = selection.toString().trim();
  if (original) savedSelection = { range, original };
});

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = [
    "position:fixed",
    "z-index:2147483647",
    "right:16px",
    "bottom:16px",
    "max-width:360px",
    "padding:12px 16px",
    "border-radius:8px",
    "background:#222",
    "color:#fff",
    "font:14px system-ui"
  ].join(";");

  document.documentElement.append(toast);
  setTimeout(() => toast.remove(), 4000);
}
