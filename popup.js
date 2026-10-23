const apiKeyInput = document.querySelector("#apiKey");
const modelSelect = document.querySelector("#model");
const status = document.querySelector("#status");

const DEFAULT_MODEL = "respan/span-01-lite";

const MODELS = [
  ["respan/span-01-lite", "Respan Span-01 Lite"],
  ["qwen/qwen3guard-gen-8b", "Qwen3Guard Gen 8B"],
  ["amazon/nova-micro-v1", "Amazon Nova Micro"],
  ["openai/gpt-oss-20b", "OpenAI GPT-OSS 20B"]
];

async function init() {
  const saved = await browser.storage.local.get(["apiKey", "model"]);
  apiKeyInput.value = saved.apiKey || "";

  modelSelect.replaceChildren(...MODELS.map(([id, label]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    return option;
  }));

  const savedModel = MODELS.some(([id]) => id === saved.model)
    ? saved.model
    : DEFAULT_MODEL;

  modelSelect.value = savedModel;
  modelSelect.disabled = false;
}

document.querySelector("#save").addEventListener("click", async () => {
  await browser.storage.local.set({
    apiKey: apiKeyInput.value.trim(),
    model: modelSelect.value || DEFAULT_MODEL
  });

  status.textContent = "Settings saved.";
});

init();
