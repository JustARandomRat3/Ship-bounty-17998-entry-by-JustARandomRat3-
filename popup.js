const extensionAPI = globalThis.browser || globalThis.chrome;

if (!extensionAPI) {
  throw new Error("Extension API is not available in this environment.");
}

const apiKey = document.querySelector("#apiKey");
const model = document.querySelector("#model");
const status = document.querySelector("#status");
const DEFAULT_MODEL = "respawn/span-01-lite";

extensionAPI.storage.local.get(["apiKey", "model"]).then((saved) => {
  apiKey.value = saved.apiKey || "";
  const selected = saved.model || DEFAULT_MODEL;

  if (Array.from(model.options).some((option) => option.value === selected)) {
    model.value = selected;
  } else {
    model.value = DEFAULT_MODEL;
  }

  status.textContent = "Ready to update";
  status.classList.remove("success");
});

document.querySelector("#save").addEventListener("click", async () => {
  const chosenModel = model.value || DEFAULT_MODEL;

  await extensionAPI.storage.local.set({
    apiKey: apiKey.value.trim(),
    model: chosenModel
  });

  status.textContent = "Settings saved.";
  status.classList.add("success");
});
