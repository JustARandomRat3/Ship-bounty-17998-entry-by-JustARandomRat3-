const extensionAPI = globalThis.browser || globalThis.chrome;

if (!extensionAPI) {
  throw new Error("Extension API is not available in this environment.");
}

const apiKey = document.querySelector("#apiKey");
const model = document.querySelector("#model");
const status = document.querySelector("#status");

extensionAPI.storage.local.get(["apiKey", "model"]).then((saved) => {
  apiKey.value = saved.apiKey || "";
  model.value = saved.model || "openai";
  status.textContent = "Ready to update";
  status.classList.remove("success");
});

document.querySelector("#save").addEventListener("click", async () => {
  await extensionAPI.storage.local.set({
    apiKey: apiKey.value.trim(),
    model: model.value.trim() || "openai"
  });

  status.textContent = "Settings saved.";
  status.classList.add("success");
});
