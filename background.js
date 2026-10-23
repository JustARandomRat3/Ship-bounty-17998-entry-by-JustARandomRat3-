const extensionAPI = globalThis.browser || globalThis.chrome;

if (!extensionAPI) {
  throw new Error("Extension API is not available in this environment.");
}

const DEFAULT_MODEL = "respan/span-01-lite";
const VALID_MODELS = new Set([
  "respan/span-01-lite",
  "typesafe/jev-1.13",
  "amazon/nova-micro-v1",
  "mistralai/mistral-small-3.2"
]);

const normalizeModel = (value) => {
  const candidate = (value || DEFAULT_MODEL).trim();
  return VALID_MODELS.has(candidate) ? candidate : DEFAULT_MODEL;
};

extensionAPI.runtime.onInstalled.addListener(() => {
  extensionAPI.contextMenus.create({
    id: "stretch-selection",
    title: "Stretch selected text",
    contexts: ["selection"]
  });
});

extensionAPI.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "stretch-selection" || !tab?.id) return;

  try {
    const { apiKey, model } = await extensionAPI.storage.local.get(["apiKey", "model"]);
    const selectedModel = normalizeModel(model);

    if (!apiKey) {
      await extensionAPI.tabs.sendMessage(tab.id, {
        type: "STRETCH\_ERROR",
        message: "Add your Pollinations API key in the extension popup first."
      });
      return;
    }

    const response = await fetch(
      "https://gen.pollinations.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content:
                "Rewrite the user's text much more concisely while preserving its meaning and important details. Return only the rewritten text."
            },
            { role: "user", content: info.selectionText || "" }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed (${response.status}): ${errorText || "Unknown model or request error"}`
      );
    }

    const data = await response.json();
    const shortened = data.choices?.[0]?.message?.content?.trim();

    if (!shortened) throw new Error("The model returned no text.");

    await extensionAPI.tabs.sendMessage(tab.id, {
      type: "STRETCH\_RESULT",
      shortened
    });
  } catch (error) {
    await extensionAPI.tabs.sendMessage(tab.id, {
      type: "STRETCH\_ERROR",
      message: error.message || "Could not stretch that selection."
    });
  }
});
