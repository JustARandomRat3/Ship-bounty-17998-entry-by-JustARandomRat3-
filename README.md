# Stretchtext

Stretchtext is a browser extension that shortens selected text using a Pollinations AI model and replaces it inline on the page. Clicking the shortened text restores the original text.

## Features

- Select text on any webpage
- Use the extension context menu to shorten it
- Save a Pollinations API key in the popup
- Choose from supported text models:
  - `respan/span-01-lite`
  - `typesafe/jev-1.13`
  - `amazon/nova-micro-v1`
  - `mistralai/mistral-small-3.2`
- Inline replacement with a click-to-expand toggle

## Installation

1. Open your browser's extension management page.
2. Enable Developer Mode.
3. Load the unpacked extension from this folder.
4. Open the extension popup and enter your Pollinations API key.
5. Save the settings.

## Notes

- The extension requests text generation from `https://gen.pollinations.ai/v1/chat/completions`.
- The manifest is configured for a Firefox-compatible extension layout and includes the required permissions for context menus, storage, and active tab access.
- If no valid model is saved, the extension defaults to `respan/span-01-lite`.

## Files

- `manifest.json` — browser extension manifest
- `background.js` — context menu action and API request handling
- `content.js` — inline text replacement logic and toast messages
- `popup.html` — settings UI
- `popup.js` — popup logic for saving the API key and model selection
