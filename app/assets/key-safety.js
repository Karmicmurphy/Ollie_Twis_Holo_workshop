(() => {
  const KEY = "twisHolo.full.v1";

  function scrubStoredApiKey() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state && state.settings && Object.prototype.hasOwnProperty.call(state.settings, "apiKey")) {
        delete state.settings.apiKey;
        localStorage.setItem(KEY, JSON.stringify(state));
      }
    } catch {
      // Never block the app because key scrubbing failed.
    }
  }

  function decorateKeyField() {
    const keyInput = document.querySelector("#aiKey");
    if (!keyInput) return;
    keyInput.value = "";
    keyInput.placeholder = "Session only — not saved";
    keyInput.autocomplete = "off";
  }

  function wrapSaveButton() {
    const button = document.querySelector("#saveAI");
    if (!button || button.dataset.keySafetyWrapped) return;
    const old = button.onclick;
    button.onclick = async function wrappedSaveAI(event) {
      if (typeof old === "function") {
        await old.call(this, event);
      }
      scrubStoredApiKey();
      decorateKeyField();
      const status = document.querySelector("#aiStatus");
      if (status) status.textContent = "AI adapter configured. API key is session-only and not saved.";
    };
    button.dataset.keySafetyWrapped = "1";
  }

  scrubStoredApiKey();
  window.addEventListener("DOMContentLoaded", () => {
    scrubStoredApiKey();
    decorateKeyField();
    setTimeout(wrapSaveButton, 0);
    setTimeout(wrapSaveButton, 500);
  });
  window.addEventListener("beforeunload", scrubStoredApiKey);
})();
