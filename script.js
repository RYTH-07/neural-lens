/**
 * script.js — Neural Lens SPA
 * ══════════════════════════════════════════════════════════════
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │           SPA NAVIGATION LOGIC — READ THIS FIRST        │
 * └─────────────────────────────────────────────────────────┘
 *
 * This is a zero-framework Single Page Application. Every
 * "page" is a <section class="page"> in index.html. Only
 * ONE page is visible at a time via the .active class.
 *
 * HOW switchPage() WORKS:
 * ────────────────────────
 * 1. Remove .active from every .page element.
 *    → CSS rule ".page { display:none }" hides them all.
 *
 * 2. Add .active to the target page.
 *    → CSS rule ".page.active { display:block }" shows it.
 *    → The @keyframes slideIn animation fires automatically
 *      because .active also triggers the animation property.
 *
 * 3. Deactivate all sidebar .nav-btn links, then activate
 *    the one whose data-page attribute matches the target.
 *    → This drives the crimson highlight on the sidebar item.
 *
 * 4. Scroll #main back to top — without this, navigation
 *    from a long page would leave the new page mid-scroll.
 *
 * 5. Update the URL hash with history.pushState() so the
 *    browser's back/forward buttons work correctly, and so
 *    users can bookmark any page directly.
 *
 * 6. Run page-specific setup (heatmap rebuild, wf reset, etc.)
 *
 * WHY NO EXIT ANIMATION:
 * ────────────────────────
 * Exit + entry animations running simultaneously create visual
 * chaos — two things moving at once. The old page disappears
 * instantly; the new page slides in. This is the same pattern
 * used by iOS, Material Design, and most production SPAs.
 *
 * ══════════════════════════════════════════════════════════════
 * MODULES
 * ══════════════════════════════════════════════════════════════
 * 1. SPA Router       — switchPage(), URL hash, popstate
 * 2. Theme            — Dark/light toggle + localStorage
 * 3. Sidebar          — Mobile open/close + topics dropdown
 * 4. Heatmap          — Self-attention demo (attention page)
 * 5. Tokenizer        — Real-time tokenizer (lab page)
 * 6. Waterfall        — Probability waterfall (lab page)
 * 7. Video Modal      — YouTube-nocookie overlay
 * 8. Quiz             — Multiple-choice engine
 */

'use strict';


/* ══════════════════════════════════════════════════════════
   1. SPA ROUTER
   ══════════════════════════════════════════════════════════ */

/**
 * switchPage — the central navigation function.
 *
 * Called from:
 *   • Sidebar nav buttons (onclick="switchPage('page-id', this)")
 *   • Topic page prev/next buttons (passing a querySelector result)
 *   • Home grid cards (same pattern)
 *   • DOMContentLoaded (for initial page load from URL hash)
 *
 * @param {string}      pageId   — id of the target .page element
 * @param {HTMLElement} [linkEl] — clicked nav button (optional)
 */
function switchPage(pageId, linkEl) {

  /* ── Step 1: Hide all pages ─────────────────────────── */
  // Removing .active triggers CSS: display → none, opacity → 0.
  // No exit animation — instant removal, clean visual slate.
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  /* ── Step 2: Show the target page ───────────────────── */
  // Adding .active triggers @keyframes slideIn:
  //   from { opacity:0; transform:translateY(12px) }
  //   to   { opacity:1; transform:translateY(0)    }
  // The cubic-bezier(0.4,0,0.2,1) curve starts fast and
  // decelerates — mimicking natural physical motion.
  const target = document.getElementById(pageId);
  if (!target) return;
  target.classList.add('active');

  /* ── Step 3: Update sidebar active state ────────────── */
  // Clear all nav buttons, then activate the matching one.
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  // Accept the element directly OR find it by data-page attribute.
  const activeBtn = (linkEl && linkEl.classList.contains('nav-btn'))
    ? linkEl
    : document.querySelector(`.nav-btn[data-page="${pageId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  /* ── Step 4: Scroll to top ───────────────────────────── */
  document.getElementById('main').scrollTo({ top: 0 });
  window.scrollTo({ top: 0 });

  /* ── Step 5: Update URL hash ─────────────────────────── */
  // pushState changes the URL bar without reloading the page.
  // Users can bookmark "index.html#page-quiz" and return directly.
  history.pushState(null, '', '#' + pageId);

  /* ── Step 6: Close mobile sidebar if open ───────────── */
  closeSidebar();

  /* ── Step 7: Page-specific initialisation ───────────── */
  // Some pages need setup every time they become visible.
  if (pageId === 'page-attention') {
    // Rebuild the heatmap spans — they may have been cleared
    // if the page was visited, then another page was shown.
    buildHeatmap();
  }
  if (pageId === 'page-lab') {
    // Reset the waterfall so it starts fresh each visit.
    wfReset();
  }
}

/* Handle browser back/forward navigation */
window.addEventListener('popstate', () => {
  const hash = window.location.hash.slice(1);
  if (hash && document.getElementById(hash)?.classList.contains('page')) {
    switchPage(hash);
  }
});


/* ══════════════════════════════════════════════════════════
   2. THEME
   ══════════════════════════════════════════════════════════ */

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next   = isDark ? 'light' : 'dark';
  if (next === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('nl-theme', next);
}

/* Restore saved theme on load */
(function() {
  const saved = localStorage.getItem('nl-theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();


/* ══════════════════════════════════════════════════════════
   3. SIDEBAR — Mobile + Topics dropdown
   ══════════════════════════════════════════════════════════ */

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('visible');
}

/**
 * Toggle the Topics collapsible group.
 * Updates aria-expanded and toggles the .collapsed class on the
 * children div, which CSS transitions from max-height to 0.
 */
function toggleGroup() {
  const btn  = document.querySelector('.nav-group-toggle');
  const list = document.getElementById('topics-list');
  const isExpanded = btn.getAttribute('aria-expanded') === 'true';

  btn.setAttribute('aria-expanded', String(!isExpanded));
  list.classList.toggle('collapsed', isExpanded);
}


/* ══════════════════════════════════════════════════════════
   4. ATTENTION HEATMAP

   EXPLANATION (for your professor):
   ──────────────────────────────────
   In a real Transformer, the attention score from token i
   to token j is computed as:

       score(i,j) = dot(Q_i, K_j) / sqrt(d_k)

   then softmax is applied across all j to produce weights
   that sum to 1. A high weight means token i "pays attention"
   to token j when computing its new representation.

   This demo simulates that with a hand-crafted 10×10 matrix
   ATTN[i][j] for the sentence:
   "The model learns context by attending to every other token"

   The values reflect plausible linguistic relationships:
   verbs attend to their subjects/objects, adjectives attend
   to their head nouns, etc.

   On hover over word i:
     1. Container gets .hovering → CSS dims ALL .hw to opacity:0.15
     2. For each word j, we read ATTN[i][j] and assign:
          j === i → .hw-source (ring outline, full opacity)
          w ≥ 0.6 → .hw-high   (crimson bg, opacity 1)
          w ≥ 0.3 → .hw-mid    (faint bg, opacity 0.6)
          w < 0.3 → .hw-low    (stays at 0.15)
     3. CSS transitions (0.2s) animate all visual changes.
        JS only sets class names — no requestAnimationFrame needed.

   On mouseleave: all classes cleared → CSS restores neutral.
   ══════════════════════════════════════════════════════════ */

// Words in the demo sentence
const HM_WORDS = [
  'The','model','learns','context','by','attending','to','every','other','token'
];

// ATTN[i][j] = attention weight FROM word i TO word j
// Values are hand-crafted to reflect plausible linguistic attention
const ATTN = [
  // The
  [0.55, 0.80, 0.20, 0.12, 0.08, 0.10, 0.08, 0.08, 0.08, 0.10],
  // model
  [0.80, 0.90, 0.70, 0.45, 0.20, 0.30, 0.10, 0.10, 0.10, 0.40],
  // learns
  [0.30, 0.80, 0.90, 0.80, 0.60, 0.50, 0.20, 0.20, 0.12, 0.50],
  // context
  [0.20, 0.40, 0.65, 0.90, 0.42, 0.80, 0.50, 0.62, 0.55, 0.90],
  // by
  [0.10, 0.20, 0.52, 0.40, 0.90, 0.82, 0.32, 0.20, 0.12, 0.30],
  // attending
  [0.10, 0.32, 0.62, 0.72, 0.72, 0.90, 0.80, 0.70, 0.62, 0.70],
  // to
  [0.10, 0.20, 0.32, 0.52, 0.42, 0.80, 0.90, 0.62, 0.52, 0.70],
  // every
  [0.10, 0.12, 0.22, 0.62, 0.22, 0.52, 0.52, 0.90, 0.82, 0.80],
  // other
  [0.10, 0.10, 0.12, 0.52, 0.12, 0.42, 0.42, 0.80, 0.90, 0.80],
  // token
  [0.22, 0.42, 0.52, 0.90, 0.22, 0.62, 0.62, 0.80, 0.72, 0.92],
];

// Map a numeric weight to a CSS class
function hmClass(w) {
  return w >= 0.6 ? 'hw-high' : w >= 0.3 ? 'hw-mid' : 'hw-low';
}

let hmSpans = []; // Store span references for reuse

function buildHeatmap() {
  const container = document.getElementById('heatmap-sent');
  if (!container) return;

  // If spans already exist and are still in the DOM, skip rebuild
  if (hmSpans.length && container.contains(hmSpans[0])) return;

  container.innerHTML = '';
  hmSpans = [];

  HM_WORDS.forEach((word, i) => {
    const span = document.createElement('span');
    span.className   = 'hw';
    span.textContent = word;

    span.addEventListener('mouseenter', () => {
      // Step 1: Dim everything — CSS handles the visual via .hovering
      container.classList.add('hovering');

      // Step 2: Classify each word by its attention weight to word i
      hmSpans.forEach((s, j) => {
        // Clear any previous classification first
        s.classList.remove('hw-source', 'hw-high', 'hw-mid', 'hw-low');

        if (j === i) {
          s.classList.add('hw-source');          // Hovered word: ring outline
        } else {
          s.classList.add(hmClass(ATTN[i][j]));  // Others: weight-based class
        }
      });
    });

    span.addEventListener('mouseleave', () => {
      container.classList.remove('hovering');
      hmSpans.forEach(s =>
        s.classList.remove('hw-source', 'hw-high', 'hw-mid', 'hw-low')
      );
    });

    container.appendChild(span);
    hmSpans.push(span);
  });
}


/* ══════════════════════════════════════════════════════════
   5. TOKENIZER

   The regex /([a-zA-Z0-9']+|[^a-zA-Z0-9']+)/g splits input
   into alternating "word-character runs" and "non-word-char runs".

   "Hello, world!" → ["Hello"] [", "] ["world"] ["!"]

   Whitespace is replaced with · (U+00B7 MIDDLE DOT) so users
   can see that spaces are preserved as real tokens.

   DocumentFragment batches all DOM insertions into one reflow.
   ══════════════════════════════════════════════════════════ */

function tokInit() {
  const input  = document.getElementById('tok-input');
  const output = document.getElementById('tok-output');
  const count  = document.getElementById('tok-count');
  if (!input) return;

  input.addEventListener('input', () => {
    const raw    = input.value;
    const tokens = raw ? (raw.match(/([a-zA-Z0-9']+|[^a-zA-Z0-9']+)/g) || []) : [];

    output.innerHTML = '';

    if (!tokens.length) {
      output.innerHTML = '<span class="tok-empty">Tokens will appear here&hellip;</span>';
      count.textContent = '0 tokens';
      return;
    }

    // Build all chips in a fragment to minimise DOM reflows
    const frag = document.createDocumentFragment();
    tokens.forEach(t => {
      const chip = document.createElement('span');
      chip.className   = 'tok-chip';
      chip.textContent = t.replace(/ /g, '\u00B7').replace(/\t/g, '\u00BB\u00B7');
      frag.appendChild(chip);
    });

    output.appendChild(frag);
    const n = tokens.length;
    count.textContent = n + ' token' + (n === 1 ? '' : 's');
  });
}


/* ══════════════════════════════════════════════════════════
   6. PROBABILITY WATERFALL

   Simulates autoregressive next-token generation.
   Each step shows 3 candidate tokens with probabilities;
   the winner (highest probability) is appended.

   ANIMATION BREAKDOWN:
   - Each candidate column uses @keyframes wfFall (translateY
     from -20px) with staggered delays (0, 75, 150ms) via CSS
     nth-child — giving the "falling in" effect.
   - The bar height animates from 0 → (prob × 54)px using
     cubic-bezier(0.34, 1.4, 0.64, 1) — a spring curve with
     a slight overshoot for a physical "settle" feel.
   - The bar starts at height:0, then two nested
     requestAnimationFrame() calls ensure the browser has
     painted the element at height 0 before transitioning up.
   ══════════════════════════════════════════════════════════ */

const WF_STEPS = [
  { match:'predict',  cands:[{t:' the',prob:.41},{t:' next',prob:.29},{t:' text',prob:.18}] },
  { match:'the',      cands:[{t:' next',prob:.53},{t:' most',prob:.21},{t:' correct',prob:.13}] },
  { match:'next',     cands:[{t:' token',prob:.63},{t:' word',prob:.25},{t:' element',prob:.08}] },
  { match:'token',    cands:[{t:' in',prob:.48},{t:' given',prob:.30},{t:' at',prob:.12}] },
  { match:'in',       cands:[{t:' a',prob:.40},{t:' each',prob:.27},{t:' the',prob:.21}] },
  { match:'a',        cands:[{t:' sequence',prob:.56},{t:' sentence',prob:.27},{t:' corpus',prob:.11}] },
  { match:'sequence', cands:[{t:'.',prob:.45},{t:' of',prob:.33},{t:',',prob:.14}] },
];

let wfStep = 0, wfBusy = false;

function wfGenerate() {
  if (wfBusy || wfStep >= WF_STEPS.length) return;
  wfBusy = true;

  const entry  = WF_STEPS[wfStep];
  const sorted = [...entry.cands].sort((a, b) => b.prob - a.prob);
  const winner = sorted[0];
  const stage  = document.getElementById('wf-stage');

  stage.innerHTML = '';

  sorted.forEach(c => {
    const isWin = c === winner;

    // Build the column DOM: bar-track → bar, chip label, percentage
    const col   = document.createElement('div');
    col.className = 'wf-col';

    const track = document.createElement('div');
    track.className = 'wf-bar-track';
    const bar   = document.createElement('div');
    bar.className = 'wf-bar' + (isWin ? ' win' : '');
    bar.style.height = '0px';
    track.appendChild(bar);

    const chip  = document.createElement('div');
    chip.className = 'wf-chip' + (isWin ? ' win' : '');
    chip.textContent = c.t.trim() || c.t;

    const pct   = document.createElement('div');
    pct.className = 'wf-pct' + (isWin ? ' win' : '');
    pct.textContent = Math.round(c.prob * 100) + '%';

    col.append(track, chip, pct);
    stage.appendChild(col);

    // Animate bar height after DOM paints at height:0
    // Double rAF ensures the "from" height is committed before transition starts
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.transition = 'height 0.48s cubic-bezier(0.34, 1.4, 0.64, 1)';
      bar.style.height = Math.round(c.prob * 54) + 'px';
    }));
  });

  // After 1.15s: append winner to sentence
  setTimeout(() => {
    const sentEl = document.getElementById('wf-sentence');
    const currentText = sentEl.textContent;
    sentEl.innerHTML = '';

    const base = document.createElement('span');
    base.textContent = currentText;

    const chosen = document.createElement('span');
    chosen.className = 'wf-chosen';
    chosen.textContent = winner.t;

    sentEl.append(base, chosen);

    wfStep++;
    wfBusy = false;

    if (wfStep >= WF_STEPS.length) {
      const btn = document.getElementById('wf-gen');
      if (btn) { btn.disabled = true; btn.textContent = 'Sequence complete'; }
      const rst = document.getElementById('wf-reset');
      if (rst) rst.style.display = 'inline-flex';
    }
  }, 1150);
}

function wfReset() {
  wfStep = 0; wfBusy = false;
  const stage = document.getElementById('wf-stage');
  const sentEl  = document.getElementById('wf-sentence');
  const btn   = document.getElementById('wf-gen');
  const rst   = document.getElementById('wf-reset');
  if (stage)  stage.innerHTML = '';
  if (sentEl) sentEl.innerHTML = 'Large language models are trained to predict';
  if (btn)    { btn.disabled = false; btn.textContent = 'Generate next token'; }
  if (rst)    rst.style.display = 'none';
}


/* ══════════════════════════════════════════════════════════
   7. VIDEO MODAL

   EXPLANATION (for your professor):
   ──────────────────────────────────
   The modal's open/close states are controlled by CSS class .open:

     .modal              { opacity:0; pointer-events:none; }
     .modal.open         { opacity:1; pointer-events:auto; }
     .modal-box          { transform:scale(0.93); }
     .modal.open .modal-box { transform:scale(1); }

   Both transitions use cubic-bezier for a premium feel.

   The <iframe> is NOT in the HTML by default. It is injected
   by openModal() at click time for two reasons:
     1. PERFORMANCE: YouTube loads fonts, scripts, and trackers
        the moment an <iframe src="..."> is in the DOM — even if
        not visible. Lazy injection means zero YouTube overhead
        until the user clicks.
     2. PRIVACY: youtube-nocookie.com sets no tracking cookies
        until the user actually interacts with the player.

   closeModal() removes the .open class (fading out), then after
   280ms (the CSS transition duration) clears the iframe HTML —
   this stops the video audio immediately rather than waiting.
   ══════════════════════════════════════════════════════════ */

let modalOpen = false;

function openModal(cardEl) {
  if (modalOpen) return;
  modalOpen = true;

  const vid   = cardEl.dataset.vid;
  const title = cardEl.dataset.title;
  const ch    = cardEl.dataset.ch;

  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-ch').textContent    = ch;

  // Inject iframe with youtube-nocookie.com — avoids Error 153
  // and prevents cookie/tracker loading until user interaction.
  const iframe = document.createElement('iframe');
  iframe.src             = `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0`;
  iframe.allow           = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.title           = title;
  document.getElementById('modal-player').appendChild(iframe);

  // Show modal — adding .open triggers CSS transitions
  const modal = document.getElementById('modal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Lock page scroll
  document.getElementById('modal').querySelector('.modal-close').focus();
}

function closeModal() {
  if (!modalOpen) return;
  modalOpen = false;

  const modal = document.getElementById('modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  // Wait for CSS fade-out to finish (280ms) before destroying iframe.
  // Destroying it immediately would cut the audio abruptly mid-animation.
  setTimeout(() => {
    document.getElementById('modal-player').innerHTML = '';
  }, 280);
}

// Also close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOpen) closeModal();
});


/* ══════════════════════════════════════════════════════════
   8. QUIZ ENGINE
   ══════════════════════════════════════════════════════════ */

// Correct answer index (0-based) for each question, in order
const Q_ANSWERS = [1, 1, 2, 1, 1, 2, 1, 1];

// Explanation shown after answering each question
const Q_EXPLAIN = [
  'Correct. BPE starts with characters and iteratively merges the most frequent adjacent pair until the vocabulary reaches the target size (e.g. 50,257 for GPT-2).',
  'Correct. Embeddings are learned during training. Co-occurrence statistics cause semantically similar tokens to cluster together, enabling vector arithmetic like king − man + woman ≈ queen.',
  'Correct. Attention(Q,K,V) = softmax(QKᵀ / √d_k) · V. The √d_k scaling prevents gradient saturation in high dimensions.',
  'Correct. Causal masking sets all upper-triangular attention scores to −∞ before softmax, making them zero after normalisation — enforcing strictly left-to-right generation.',
  'Correct. The Reward Model is trained on human preference rankings of (prompt, completion) pairs. Once trained, it can score new responses without further human involvement.',
  'Correct. A hallucination is a fluent, confident output that is factually false. The model generates statistically likely continuations — not verified facts.',
  'Correct. RAG retrieves real documents and inserts them into the prompt context, grounding generation in verifiable evidence and reducing the likelihood of confabulation.',
  'Correct. The KL penalty measures divergence between the RLHF-updated policy and the SFT baseline, preventing reward hacking — where the model exploits the RM rather than genuinely improving.',
];

let qAnswered = new Array(8).fill(false);
let qScore    = 0;

function quizHandle(btn, qIdx, chosen) {
  if (qAnswered[qIdx]) return;
  qAnswered[qIdx] = true;

  // Disable all options in this question
  const opts = btn.parentElement.querySelectorAll('.q-opt');
  opts.forEach(o => { o.disabled = true; });

  const fb      = document.getElementById('fb-' + qIdx);
  const correct = chosen === Q_ANSWERS[qIdx];

  if (correct) {
    btn.classList.add('correct');
    fb.textContent = Q_EXPLAIN[qIdx];
    fb.className   = 'q-fb correct';
    qScore++;
  } else {
    btn.classList.add('wrong');
    opts[Q_ANSWERS[qIdx]].classList.add('correct');
    fb.textContent = 'Not quite. ' + Q_EXPLAIN[qIdx];
    fb.className   = 'q-fb wrong';
  }

  // Show result panel when all questions are answered
  if (qAnswered.every(Boolean)) quizShowResult();
}

function quizShowResult() {
  const el  = document.getElementById('quiz-result');
  el.style.display = 'block';
  document.getElementById('qr-score').textContent = qScore + ' / 8';

  const msgs = [
    'Keep reading — the concepts will click with another pass.',
    'Keep reading — the concepts will click with another pass.',
    'Solid start. Revisit the topic pages for what you missed.',
    'Progress. One more read will make the difference.',
    'Getting there. Focus on the questions you missed.',
    'Good result. A few details to sharpen.',
    'Strong result. One topic to revisit.',
    'Excellent — you have a firm technical grasp of the material.',
    'Perfect score. You understand this at production depth.',
  ];
  document.getElementById('qr-msg').textContent = msgs[qScore];
}

function quizReset() {
  qAnswered = new Array(8).fill(false); qScore = 0;
  document.querySelectorAll('.q-opt').forEach(b => {
    b.classList.remove('correct', 'wrong');
    b.disabled = false;
  });
  document.querySelectorAll('.q-fb').forEach(f => {
    f.textContent = ''; f.className = 'q-fb';
  });
  document.getElementById('quiz-result').style.display = 'none';
}


/* ══════════════════════════════════════════════════════════
   BOOT — wire up everything once the DOM is ready
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* Restore page from URL hash (for bookmarks + back/forward) */
  const hash = window.location.hash.slice(1); // strip '#'
  const isValid = hash && document.getElementById(hash)?.classList.contains('page');
  switchPage(isValid ? hash : 'page-home');

  /* Tokenizer */
  tokInit();

  /* Quiz — bind click handlers to every option button */
  document.querySelectorAll('.q-card').forEach(card => {
    const qIdx = parseInt(card.dataset.q, 10);
    card.querySelectorAll('.q-opt').forEach((btn, i) => {
      btn.addEventListener('click', () => quizHandle(btn, qIdx, i));
    });
  });

  /* Waterfall reset (safety: ensure clean state on first lab visit) */
  wfReset();
});
