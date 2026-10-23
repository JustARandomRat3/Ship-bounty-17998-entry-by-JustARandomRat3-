const apiKey = document.querySelector("#apiKey");
const model = document.querySelector("#model");
const status = document.querySelector("#status");

browser.storage.local.get(["apiKey", "model"]).then((saved) => {
  apiKey.value = saved.apiKey || "";
  model.value = saved.model || "openai";
});

document.querySelector("#save").addEventListener("click", async () => {
  await browser.storage.local.set({
    apiKey: apiKey.value.trim(),
    model: model.value.trim() || "openai"
  });

  status.textContent = "Settings saved.";
});
