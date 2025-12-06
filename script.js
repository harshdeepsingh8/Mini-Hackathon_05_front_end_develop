// script.js
// Async Quote Generator
// Fetches inspirational quotes and updates the DOM.
// Features: manual fetch, auto mode, stop, error handling, simple cache, abort/timeouts.

(() => {
  // --- Config ---
  const API_URL = 'https://api.quotable.io/random'; 
  const AUTO_INTERVAL_MS = 8000; 
  const FETCH_TIMEOUT_MS = 8000; 

  // --- DOM Elements ---
  const statusEl = document.getElementById('status');
  const quoteTextEl = document.getElementById('quoteText');
  const quoteAuthorEl = document.getElementById('quoteAuthor');
  const quoteTagsEl = document.getElementById('quoteTags');
  const newQuoteBtn = document.getElementById('newQuoteBtn');
  const stopBtn = document.getElementById('stopBtn');

  // --- State ---
  let autoTimer = null;
  let isAutoRunning = false;
  const recentQuotes = new Set(); 
  const MAX_CACHE = 20;

  // --- Helpers ---
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
    // keep cache bounded
    if (recentQuotes.size > MAX_CACHE) {
      // delete oldest entry (not strictly LRU, but keeps size bounded)
      const first = recentQuotes.values().next().value;
      recentQuotes.delete(first);
    }
  }

  // Fetch with AbortController + timeout
  async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

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

  // Get a quote, avoid recent repeats if possible
  async function getQuote() {
    setStatus('Loading quote...', { type: 'neutral' });
    newQuoteBtn.disabled = true;

    try {
      let data = await fetchWithTimeout(API_URL);

      // The quotable API includes an _id field. If missing, we still try to display.
      // If we get a recently seen quote, try again a couple more times.
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
      // keep previous quote visible if there was one
    } finally {
      newQuoteBtn.disabled = false;
    }
  }

  // Auto mode control
  function startAutoMode() {
    if (isAutoRunning) return;
    isAutoRunning = true;
    stopBtn.disabled = false;
    newQuoteBtn.disabled = true; 
    setStatus('Auto mode running — fetching quotes every 8s.');
    // Immediately fetch once, then schedule
    getQuote().catch(() => {/* error already handled in getQuote */});
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

  // Keyboard accessibility: N for new quote, S for stop
  function handleKeydown(e) {
    if (e.key === 'N' || e.key === 'n') {
      if (!newQuoteBtn.disabled) getQuote().catch(() => {});
    } else if (e.key === 'S' || e.key === 's') {
      if (!stopBtn.disabled) stopAutoMode();
    }
  }

  // --- Event listeners ---
  newQuoteBtn.addEventListener('click', () => getQuote().catch(() => {}));
  stopBtn.addEventListener('click', stopAutoMode);
  document.addEventListener('keydown', handleKeydown);

  // --- Initialization ---
  // Provide an initial friendly message and keep page usable without network.
  setStatus('Ready. Click "New Quote" to begin or press "N".');
  updateQuoteUI({ content: 'Click "New Quote" to begin!', author: '', tags: [] });

  // Optionally start in auto mode if a query param is present (e.g., ?auto=true)
  (function maybeStartAutoFromQuery() {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get('auto') === 'true') startAutoMode();
    } catch (e) { /* ignore */ }
  })();

  // Expose start/stop on window for debugging
  window.__quoteApp = { startAutoMode, stopAutoMode, getQuote };
})();

