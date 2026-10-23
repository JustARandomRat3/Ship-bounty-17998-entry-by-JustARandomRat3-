const extensionAPI = globalThis.browser || globalThis.chrome;

if (!extensionAPI) {
  throw new Error("Extension API is not available in this environment.");
}

const apiKey = document.querySelector("#apiKey");
const model = document.querySelector("#model");
const status = document.querySelector("#status");
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

extensionAPI.storage.local.get(["apiKey", "model"]).then((saved) => {
  apiKey.value = saved.apiKey || "";
  const selected = normalizeModel(saved.model);

  if (Array.from(model.options).some((option) => option.value === selected)) {
    model.value = selected;
  } else {
    model.value = DEFAULT_MODEL;
  }

  status.textContent = "Ready to update";
  status.classList.remove("success");
});

document.querySelector("#save").addEventListener("click", async () => {
  const chosenModel = normalizeModel(model.value);

  await extensionAPI.storage.local.set({
    apiKey: apiKey.value.trim(),
    model: chosenModel
  });

  status.textContent = "Settings saved.";
  status.classList.add("success");
});
