
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