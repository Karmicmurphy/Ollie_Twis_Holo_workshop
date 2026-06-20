(() => {
  const ICON = "assets/icons/twis-holo-icon.svg";
  let deferredInstallPrompt = null;

  function toast(message) {
    const t = document.querySelector("#toast");
    if (!t) return alert(message);
    t.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3600);
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function fallbackText() {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "On iPhone/iPad: tap Share, then Add to Home Screen.";
    if (/android/.test(ua)) return "On Android: open Chrome menu ⋮, then tap Install app or Add to Home screen.";
    return "On PC: open Chrome/Edge menu ⋮, then Apps or Install this site as an app.";
  }

  async function installWorkshop() {
    if (isStandalone()) {
      toast("Twis Holo is already installed. Use the home-screen or desktop icon.");
      return;
    }
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      if (choice?.outcome === "accepted") toast("Twis Holo installed. Use the new icon to open the Workshop.");
      else toast("Install skipped. " + fallbackText());
      return;
    }
    toast(fallbackText());
  }

  function injectStyles() {
    if (document.querySelector("#twisInstallStyle")) return;
    const style = document.createElement("style");
    style.id = "twisInstallStyle";
    style.textContent = `
      .twis-install-card{position:relative;overflow:hidden;display:flex!important;align-items:center;gap:12px;border:1px solid #52e7ff!important;background:linear-gradient(135deg,#08111c,#10133a 55%,#210b3b)!important;color:#effcff!important;box-shadow:0 0 24px #45dfff22;text-align:left!important}
      .twis-install-card img{width:54px;height:54px;border-radius:14px;box-shadow:0 0 18px #79f7ff77;flex:0 0 auto}.twis-install-card span{display:block}.twis-install-card b{display:block;font-size:1.05rem}.twis-install-card small{display:block;color:#a9c9d8;margin-top:2px;line-height:1.25}
      .twis-install-float{position:fixed;right:18px;bottom:18px;z-index:50;display:flex;align-items:center;gap:10px;border:1px solid #52e7ff;border-radius:999px;background:#071019ee;color:#effcff;padding:10px 14px;box-shadow:0 0 28px #45dfff33;backdrop-filter:blur(12px)}
      .twis-install-float img{width:34px;height:34px;border-radius:10px}.twis-install-float strong{font-size:13px}.twis-install-float:hover,.twis-install-card:hover{filter:brightness(1.12)}
      @media(max-width:720px){.twis-install-float{right:10px;bottom:10px;padding:9px}.twis-install-float strong{display:none}.twis-install-card img{width:46px;height:46px}}
    `;
    document.head.appendChild(style);
  }

  function renderInstaller() {
    injectStyles();
    const cards = document.querySelector("[data-panel='home'] .cards");
    if (cards && !document.querySelector("#twisInstallCard")) {
      const card = document.createElement("button");
      card.id = "twisInstallCard";
      card.className = "card twis-install-card";
      card.type = "button";
      card.innerHTML = `<img src="${ICON}" alt=""><span><b>Install Twis Holo</b><small>Put the Workshop icon on this phone or PC.</small></span>`;
      card.onclick = installWorkshop;
      cards.prepend(card);
    }
    if (!document.querySelector("#twisInstallFloat")) {
      const btn = document.createElement("button");
      btn.id = "twisInstallFloat";
      btn.className = "twis-install-float";
      btn.type = "button";
      btn.innerHTML = `<img src="${ICON}" alt=""><strong>Install</strong>`;
      btn.onclick = installWorkshop;
      document.body.appendChild(btn);
    }
    if (isStandalone()) {
      document.querySelector("#twisInstallCard")?.remove();
      document.querySelector("#twisInstallFloat")?.remove();
    }
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstaller();
    toast("Twis Holo is ready to install. Hit the Install button.");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    toast("Twis Holo installed. Hit the icon to open the Workshop.");
    renderInstaller();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderInstaller);
  else renderInstaller();
})();
