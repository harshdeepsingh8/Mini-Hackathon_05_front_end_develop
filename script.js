
cat > script.js <<'EOF'
/* script.js - skeleton (commit 1)
   Basic DOM wiring and placeholder functions.
*/
document.addEventListener('DOMContentLoaded', () => {
  // basic selectors
  const newQuoteBtn = document.getElementById('newQuoteBtn');
  newQuoteBtn.addEventListener('click', () => {
    // placeholder
    console.log('New Quote clicked');
  });
});
EOF
cat > script.js <<'EOF'
/* script.js - commit 2
   Add basic fetch and UI update logic.
*/
const API_URL = 'https://api.quotable.io/random';

const quoteTextEl = document.getElementById('quoteText');
const quoteAuthorEl = document.getElementById('quoteAuthor');
const newQuoteBtn = document.getElementById('newQuoteBtn');
const statusEl = document.getElementById('status');

async function getQuote() {
  statusEl.textContent = 'Loading...';
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    quoteTextEl.textContent = data.content || '';
    quoteAuthorEl.textContent = data.author ? '— ' + data.author : '';
    statusEl.textContent = 'Quote loaded';
  } catch (err) {
    statusEl.textContent = 'Error loading quote';
    console.error(err);
  }
}
cat > script.js <<'EOF'
/* script.js - commit 3
   Add AbortController timeout and improved status/error messaging.
*/
const API_URL = 'https://api.quotable.io/random';
const FETCH_TIMEOUT_MS = 8000;

const quoteTextEl = document.getElementById('quoteText');
const quoteAuthorEl = document.getElementById('quoteAuthor');
const newQuoteBtn = document.getElementById('newQuoteBtn');
const statusEl = document.getElementById('status');

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = 'status';
  if (type) statusEl.classList.add(type);
}

async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return resp.json();
  } finally {
    clearTimeout(id);
  }
}

async function getQuote() {
  setStatus('Loading...', null);
  newQuoteBtn.disabled = true;
  try {
    const data = await fetchWithTimeout(API_URL);
    quoteTextEl.textContent = data.content || '';
    quoteAuthorEl.textContent = data.author ? '— ' + data.author : '';
    setStatus('Quote loaded', 'success');
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Request timed out' : 'Failed to load quote';
    setStatus(msg, 'error');
    console.error(err);
  } finally {
    newQuoteBtn.disabled = false;
  }
}

cat > script.js <<'EOF'
/* script.js - commit 4
   Add auto mode with Start/Stop behavior and keyboard shortcuts.
*/
(() => {
  const API_URL = 'https://api.quotable.io/random';
  const FETCH_TIMEOUT_MS = 8000;
  const AUTO_INTERVAL_MS = 8000;

  const quoteTextEl = document.getElementById('quoteText');
  const quoteAuthorEl = document.getElementById('quoteAuthor');
  const newQuoteBtn = document.getElementById('newQuoteBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusEl = document.getElementById('status');

  let autoTimer = null;

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status';
    if (type) statusEl.classList.add(type);
  }

  async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    } finally {
      clearTimeout(id);
    }
  }

  async function getQuote() {
    setStatus('Loading...');
    newQuoteBtn.disabled = true;
    try {
      const data = await fetchWithTimeout(API_URL);
      quoteTextEl.textContent = data.content || '';
      quoteAuthorEl.textContent = data.author ? '— ' + data.author : '';
      setStatus('Quote loaded', 'success');
    } catch (err) {
      setStatus(err.name === 'AbortError' ? 'Timed out' : 'Error fetching', 'error');
      console.error(err);
    } finally {
      newQuoteBtn.disabled = false;
    }
  }

  function startAuto() {
    if (autoTimer) return;
    setStatus('Auto mode started');
    newQuoteBtn.disabled = true;
    stopBtn.disabled = false;
    getQuote();
    autoTimer = setInterval(getQuote, AUTO_INTERVAL_MS);
  }

  function stopAuto() {
    if (!autoTimer) return;
    clearInterval(autoTimer);
    autoTimer = null;
    newQuoteBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus('Auto mode stopped');
  }

  newQuoteBtn.addEventListener('click', getQuote);
  stopBtn.addEventListener('click', stopAuto);

  // start auto if ?auto=true
  try {
    const p = new URLSearchParams(location.search);
    if (p.get('auto') === 'true') startAuto();
  } catch (e) {}

  // expose for dev
  window.__quoteApp = { getQuote, startAuto, stopAuto };
})();
EOF
cat > script.js <<'EOF'
/* script.js - commit 5 (final polish)
   Adds a small cache to avoid recent repeats, keyboard accessibility,
   and exposes simple API for debugging.
   (This is the fully featured script.)
*/
(() => {
  const API_URL = 'https://api.quotable.io/random';
  const FETCH_TIMEOUT_MS = 8000;
  const AUTO_INTERVAL_MS = 8000;
  const MAX_CACHE = 20;

  const statusEl = document.getElementById('status');
  const quoteTextEl = document.getElementById('quoteText');
  const quoteAuthorEl = document.getElementById('quoteAuthor');
  const quoteTagsEl = document.getElementById('quoteTags');
  const newQuoteBtn = document.getElementById('newQuoteBtn');
  const stopBtn = document.getElementById('stopBtn');

  let autoTimer = null;
  let isAutoRunning = false;
  const recentQuotes = new Set();

  function setStatus(text, { type = 'neutral' } = {}) {
    statusEl.textContent = text || '';
    statusEl.classList.remove('error', 'success');
    if (type === 'error') statusEl.classList.add('error');
    if (type === 'success') statusEl.classList.add('success');
  }

  function updateQuoteUI({ content = '', author = '', tags = [] } = {}) {
    quoteTextEl.textContent = content || 'No quote available.';
    quoteAuthorEl.textContent = author ? `— ${author}` : '';
    quoteTagsEl.textContent = Array.isArray(tags) && tags.length ? `Tags: ${tags.join(', ')}` : '';
  }

  function addToCache(id) {
    if (!id) return;
    recentQuotes.add(id);
    if (recentQuotes.size > MAX_CACHE) {
      const first = recentQuotes.values().next().value;
      recentQuotes.delete(first);
    }
  }

  async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  async function getQuote() {
    setStatus('Loading quote...');
    newQuoteBtn.disabled = true;

    try {
      let data = await fetchWithTimeout(API_URL);
      let attempts = 0;
      while (data && data._id && recentQuotes.has(data._id) && attempts < 4) {
        attempts++;
        data = await fetchWithTimeout(API_URL);
      }

      if (!data) throw new Error('No data returned');

      updateQuoteUI({
        content: data.content || data.quote || '',
        author: data.author || data.by || 'Unknown',
        tags: data.tags || (data.tag ? [data.tag] : [])
      });
      addToCache(data._id || `${Date.now()}-${Math.random()}`);
      setStatus('Quote updated.', { type: 'success' });
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('Request timed out. Try again.', { type: 'error' });
      } else {
        setStatus(`Error fetching quote: ${err.message}`, { type: 'error' });
      }
    } finally {
      newQuoteBtn.disabled = false;
    }
  }

  function startAutoMode() {
    if (isAutoRunning) return;
    isAutoRunning = true;
    stopBtn.disabled = false;
    newQuoteBtn.disabled = true;
    setStatus('Auto mode running — fetching quotes every 8s.');
    getQuote().catch(() => {});
    autoTimer = setInterval(() => {
      getQuote().catch(() => {});
    }, AUTO_INTERVAL_MS);
  }

  function stopAutoMode() {
    if (!isAutoRunning) return;
    isAutoRunning = false;
    stopBtn.disabled = true;
    newQuoteBtn.disabled = false;
    setStatus('Auto mode stopped.');
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function handleKeydown(e) {
    if (e.key === 'N' || e.key === 'n') {
      if (!newQuoteBtn.disabled) getQuote().catch(() => {});
    } else if (e.key === 'S' || e.key === 's') {
      if (!stopBtn.disabled) stopAutoMode();
    }
  }

  newQuoteBtn.addEventListener('click', () => getQuote().catch(() => {}));
  stopBtn.addEventListener('click', stopAutoMode);
  document.addEventListener('keydown', handleKeydown);

  setStatus('Ready. Click "New Quote" to begin or press "N".');
  updateQuoteUI({ content: 'Click "New Quote" to begin!', author: '', tags: [] });

  try {
    const params = new URLSearchParams(location.search);
    if (params.get('auto') === 'true') startAutoMode();
  } catch (e) {}

  window.__quoteApp = { startAutoMode, stopAutoMode, getQuote };
})();
EOF
