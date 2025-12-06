
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