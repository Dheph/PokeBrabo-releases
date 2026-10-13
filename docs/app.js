'use strict';

(() => {
  const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
  const buttonId = /win/i.test(platform) ? 'download-windows' : /mac/i.test(platform) ? 'download-macos' : null;
  if (buttonId) {
    const button = document.getElementById(buttonId);
    button.classList.add('recommended');
    button.setAttribute('aria-label', `${button.textContent.trim()} — download para seu sistema`);
  }

  async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // Consume the body before clearing the timeout, including stalled downloads.
      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadRelease() {
    const info = document.getElementById('release-info');
    try {
      const release = JSON.parse(await fetchWithTimeout('https://api.github.com/repos/Dheph/PokeBrabo-releases/releases/latest'));
      const date = new Date(release.published_at);
      if (!release.tag_name || !release.published_at || Number.isNaN(date.getTime())) return;
      const version = String(release.tag_name).replace(/^client-/, '');
      info.textContent = `Versão ${version} · publicada em ${date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
      info.hidden = false;
    } catch {
      info.hidden = true;
    }
  }

  async function loadNotes() {
    const fallback = document.getElementById('notes-fallback');
    try {
      if (!window.marked || !window.DOMPurify) return;
      // The publishing workflow copies the notes alongside index.html.
      const markdown = await fetchWithTimeout('RELEASE_NOTES.md');
      const html = window.marked.parse(markdown, { async: false, gfm: true });
      document.getElementById('release-notes').innerHTML = window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
      fallback.hidden = true;
    } catch {
      fallback.hidden = false;
    }
  }

  void loadRelease();
  void loadNotes();
})();
