
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