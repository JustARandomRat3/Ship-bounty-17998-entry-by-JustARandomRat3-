const extensionAPI = globalThis.browser || globalThis.chrome;

if (!extensionAPI) {
  throw new Error("Extension API is not available in this environment.");
}

const apiKey = document.querySelector("#apiKey");
const appKey = document.querySelector("#appKey");
const model = document.querySelector("#model");
const connectButton = document.querySelector("#connect");
const disconnectButton = document.querySelector("#disconnect");
const status = document.querySelector("#status");
const DEFAULT_MODEL = "qwen/qwen3guard-gen-8b";
const VALID_MODELS = new Set([
  "openai/gpt-oss-20b",
  "meta/llama-3.3-70b-instruct",
  "openai/gpt-5.4-nano",
  "qwen/qwen3guard-gen-8b"
]);

const normalizeModel = (value) => {
  const candidate = (value || DEFAULT_MODEL).trim();
  return VALID_MODELS.has(candidate) ? candidate : DEFAULT_MODEL;
};

const setStatus = (message, success = false) => {
  status.textContent = message;
  status.classList.toggle("success", success);
};

const setBusy = (busy) => {
  connectButton.disabled = busy;
  connectButton.classList.toggle("loading", busy);
};

extensionAPI.storage.local.get(["apiKey", "appKey", "model", "accessToken"]).then((saved) => {
  apiKey.value = saved.apiKey || "";
  appKey.value = saved.appKey || "";
  const selected = normalizeModel(saved.model);

  if (Array.from(model.options).some((option) => option.value === selected)) {
    model.value = selected;
  } else {
    model.value = DEFAULT_MODEL;
  }

  setStatus(saved.accessToken ? "Connected to Pollinations." : "Ready to connect");
});

connectButton.addEventListener("click", async () => {
  const clientId = appKey.value.trim();
  if (!clientId) {
    setStatus("Add your Pollinations App Key first.", false);
    return;
  }

  setBusy(true);
  setStatus("Starting Pollinations sign-in…");

  try {
    const deviceResponse = await fetch("https://enter.pollinations.ai/api/device/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId })
    });

    if (!deviceResponse.ok) {
      const errorText = await deviceResponse.text();
      throw new Error(`Could not start guest sign-in (${deviceResponse.status}): ${errorText || "Unknown error"}`);
    }

    const deviceData = await deviceResponse.json();
    const verificationUrl = deviceData.verification_uri_complete || deviceData.verification_uri;
    const deviceCode = deviceData.device_code;
    const intervalSeconds = Number(deviceData.interval) || 5;
    const timeoutSeconds = Number(deviceData.expires_in) || 1800;

    await extensionAPI.storage.local.set({
      appKey: clientId,
      apiKey: ""
    });

    if (verificationUrl) {
      await extensionAPI.tabs.create({ url: verificationUrl });
    }

    const startedAt = Date.now();
    let pending = true;

    while (pending && Date.now() - startedAt < timeoutSeconds * 1000) {
      const tokenResponse = await fetch("https://enter.pollinations.ai/api/device/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_code: deviceCode })
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.access_token) {
        await extensionAPI.storage.local.set({
          accessToken: tokenData.access_token,
          apiKey: tokenData.access_token
        });
        setStatus("Connected. Your own Pollen is ready to spend.", true);
        pending = false;
      } else if (tokenData.error && tokenData.error !== "authorization_pending") {
        throw new Error(tokenData.error_description || tokenData.error || "The Pollinations sign-in was denied.");
      } else {
        await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
      }
    }

    if (pending) {
      throw new Error("The Pollinations sign-in timed out.");
    }
  } catch (error) {
    setStatus(error.message || "Could not connect to Pollinations.");
  } finally {
    setBusy(false);
  }
});

disconnectButton.addEventListener("click", async () => {
  await extensionAPI.storage.local.set({
    accessToken: "",
    apiKey: apiKey.value.trim()
  });
  setStatus("Disconnected from Pollinations.");
});

document.querySelector("#save").addEventListener("click", async () => {
  const chosenModel = normalizeModel(model.value);
  const userKey = apiKey.value.trim();

  await extensionAPI.storage.local.set({
    apiKey: userKey,
    appKey: appKey.value.trim(),
    model: chosenModel
  });

  setStatus("Settings saved.", true);
});
