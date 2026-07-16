(() => {
  const EXPECTED_SHA = "6ef7317722202769b08d74a434519871736e055d1864fa5eb6c6fb547cb40108";
  const $ = (s) => document.querySelector(s);

  function toast(message) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2400);
  }

  function activeProjectId() {
    const select = $("#projectSelect");
    return select && select.value ? select.value : "flashriver-source-archive";
  }

  function setResult(data) {
    const out = $("#flashriverResult");
    if (!out) return;
    out.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }

  async function postJson(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok) throw new Error(data.error || data.raw || `HTTP ${res.status}`);
    return data;
  }

  async function importFlashRiver() {
    const button = $("#importFlashriver");
    const path = $("#flashriverPath")?.value.trim();
    const expectedSha256 = $("#flashriverSha")?.value.trim() || EXPECTED_SHA;
    if (!path) {
      setResult("Paste the local path to the FlashRiver ZIP first.");
      toast("FlashRiver ZIP path required");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Importing…";
    }
    setResult("Importing FlashRiver package locally. Raw source archive stays local. Nothing private is sent to GitHub or Cloudflare.");

    try {
      const data = await postJson("/api/import-flashriver", {
        path,
        expectedSha256,
        projectId: activeProjectId(),
        title: "FlashRiver Source Archive"
      });
      setResult({
        ok: true,
        projectId: data.projectId,
        artifactCount: data.artifactCount,
        sha256: data.manifest?.sha256,
        zipTest: data.manifest?.zipTest,
        publicSafeDocsImported: data.manifest?.publicSafeDocsImported,
        privateSourcesCopied: data.manifest?.privateSourcesCopied?.length || 0,
        visualsCopied: data.manifest?.visualsCopied?.length || 0,
        next: "Open My Work and search for FlashRiver, AGENT, HARNESS, SKILLS, or BUILD_PLAN."
      });
      toast("FlashRiver package imported");
      const workButton = document.querySelector(".nav[data-room='work']");
      if (workButton) setTimeout(() => workButton.click(), 800);
    } catch (err) {
      setResult(`FlashRiver import failed: ${err.message}`);
      toast("FlashRiver import failed");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Import FlashRiver package";
      }
    }
  }

  function boot() {
    const sha = $("#flashriverSha");
    if (sha && !sha.value) sha.value = EXPECTED_SHA;
    const button = $("#importFlashriver");
    if (button) button.onclick = importFlashRiver;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
