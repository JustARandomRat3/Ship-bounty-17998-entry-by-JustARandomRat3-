const extensionAPI = globalThis.browser || globalThis.chrome;

if (!extensionAPI) {
  throw new Error("Extension API is not available in this environment.");
}

const DEFAULT_MODEL = "qwen/qwen3guard-gen-8b";
const VALID_MODELS = new Set([
  "openai/gpt-oss-20b",
  "meta/llama-3.3-70b-instruct",
  "openai/gpt-5.4-nano",
  "qwen/qwen3guard-gen-8b"
]);
const TYPE_SAFE_MODELS = new Set([]);

const normalizeModel = (value) => {
  const candidate = (value || DEFAULT_MODEL).trim();
  return VALID_MODELS.has(candidate) ? candidate : DEFAULT_MODEL;
};

const resolveGenerationModel = (value) => {
  const selected = normalizeModel(value);
  return TYPE_SAFE_MODELS.has(selected) ? DEFAULT_MODEL : selected;
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
    const { apiKey, accessToken, model } = await extensionAPI.storage.local.get(["apiKey", "accessToken", "model"]);
    const selectedModel = normalizeModel(model);
    const generationModel = resolveGenerationModel(selectedModel);
    const bearerToken = (accessToken || apiKey || "").trim();

    if (!bearerToken) {
      await extensionAPI.tabs.sendMessage(tab.id, {
        type: "STRETCH\_ERROR",
        message: "Connect with Pollinations in the extension popup first so the reader can pay with their own Pollen."
      });
      return;
    }

    const response = await fetch(
      "https://gen.pollinations.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: generationModel,
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
