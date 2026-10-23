browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "stretch-selection",
    title: "Stretch selected text",
    contexts: ["selection"]
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "stretch-selection" || !tab?.id) return;

  try {
    const { apiKey, model = "openai" } =
      await browser.storage.local.get(["apiKey", "model"]);

    if (!apiKey) {
      await browser.tabs.sendMessage(tab.id, {
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
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
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
      throw new Error(`API request failed (${response.status})`);
    }

    const data = await response.json();
    const shortened = data.choices?.[0]?.message?.content?.trim();

    if (!shortened) throw new Error("The model returned no text.");

    await browser.tabs.sendMessage(tab.id, {
      type: "STRETCH\_RESULT",
      shortened
    });
  } catch (error) {
    await browser.tabs.sendMessage(tab.id, {
      type: "STRETCH\_ERROR",
      message: error.message || "Could not stretch that selection."
    });
  }
});
