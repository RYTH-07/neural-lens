NEURAL LENS
Demystifying the Machine Mind — An Interactive NLP & LLM Field Guide
A zero-dependency, framework-free Single Page Application built for CSE students. Neural Lens walks you from the mechanics of tokenization through the mathematics of self-attention to the alignment problem of RLHF — using live interactive demos, curated video lectures, and a scored quiz. No build step. No Node. No bundler. Open index.html in a browser and it runs.

Key Features

SPA Navigation — Zero Reload, Full URL Support
All nine views live in a single HTML file. A central switchPage() function swaps the visible section, updates the sidebar highlight, resets scroll position, and updates the URL hash via history.pushState(). Browser back/forward buttons work correctly. Any page can be bookmarked directly (e.g., index.html#page-quiz).
Live Tokenizer
Type any text into the Interactive Lab and watch it fragment into token chips in real time. The tokenizer runs a regex split on every input event, renders each token as an individually animated chip using a DocumentFragment batch insert, and displays a live count.
Self-Attention Heatmap
The Self-Attention topic page includes an interactive sentence where hovering any word reveals a colour-coded attention map. A hand-crafted 10×10 attention weight matrix encodes plausible linguistic relationships. On hover, CSS class assignment — not JavaScript animation — drives all visual transitions.
Probability Waterfall
The Interactive Lab simulates one step of autoregressive decoding: click Generate, three candidate tokens fall in with animated probability bars, and the highest-probability token is appended to the sentence. The bar animation uses a spring cubic-bezier curve with slight overshoot.
Privacy-First Video Modal
The Video Library embeds six curated YouTube lectures. The <iframe> element is never present in the HTML at page load — it is injected into the DOM only when a user clicks a card. The embed domain is www.youtube-nocookie.com, which sets zero tracking cookies until the user interacts with the player. This also resolves the common Error 153.
Dark / Light Theme with Persistence
A theme toggle writes the user's preference to localStorage and applies it by setting a data-theme="dark" attribute on the <html> element. All 40+ colour tokens in CSS Custom Properties switch values automatically via a single override block.
8-Question Assessed Quiz
A distraction-free quiz covering all six topics, with per-question instant feedback and a technical explanation for every answer. State is managed in two plain arrays. No frameworks, no libraries.

Tech Stack

Layer	Technology
Structure	HTML5 — Semantic elements (<aside>, <main>, <section>, <header>)
Presentation	CSS3 — Custom Properties, CSS Grid, Flexbox, @keyframes, cubic-bezier
Behaviour	Vanilla JavaScript ES6+ — history.pushState, localStorage, DocumentFragment, requestAnimationFrame
Typography	Google Fonts — Lora (serif, headings & body), DM Sans (sans, UI labels)
Media	YouTube Privacy-Enhanced Embed (youtube-nocookie.com)
Build	None — zero dependencies, zero bundler, zero Node

Architecture
Single Page Application Pattern
Neural Lens is structured as a client-side SPA without any framework. All nine "pages" are <section class="page"> elements rendered in the HTML simultaneously. The CSS rule .page { display: none } hides all of them by default. Exactly one element carries the .active class at any moment, which triggers display: block and a @keyframes slideIn entrance animation.

This approach is superior to a multi-page website for several reasons:
•	No round-trip latency. Navigation is instantaneous — the browser never fetches a new document.
•	Shared state. The theme preference, quiz state, and waterfall position persist across navigation without serialisation.
•	Coherent transitions. The Fade & Slide animation fires on every page change, giving the interface a consistent, app-like feel.
•	Single asset. One HTML file, one CSS file, one JS file. Deployment is drag-and-drop to any static host.

Visual Design Principles
Engineering Journal Aesthetic
The design language is editorial and precise: generous whitespace, a restrained type scale, sharp 3 px border radii (not rounded "bubble" UI), and thin 1 px borders. The goal is to feel like a well-typeset technical document that happens to be interactive.
Crimson / Charcoal Palette
Three values: Charcoal (#111318) for the sidebar, Off-white (#f6f5f2) for the content background, and Crimson (#c41c1c) as the sole accent colour for links, highlights, and active states. The accent is used sparingly — only where something demands attention.
Google Standard Easing
All transitions use cubic-bezier(0.4, 0, 0.2, 1), stored as the CSS variable --ease. This is the "Standard" easing curve from the Material Design motion specification. It starts fast and decelerates toward the end, mimicking the deceleration of a physical object coming to rest.
SVG Icons — No Emojis
Every icon uses inline SVG paths with stroke="currentColor". Icons automatically inherit colour from their parent, respond to the theme toggle, scale without rasterisation artefacts, and require no font-loading dependency.

Project Structure
neural-lens/
├── index.html     — All nine page sections + sidebar + modal markup
├── style.css      — Variables, layout, components, transitions (734 lines)
└── script.js      — SPA router, theme, heatmap, tokenizer,
                     waterfall, modal, quiz (650 lines)

Pages

Route	Content
#page-home	Introduction — six topic cards, navigation overview
#page-tokenization	BPE algorithm, vocabulary design, embedded video
#page-embeddings	Embedding tables, geometric structure, contextual vs static
#page-attention	QKV mechanics, live heatmap demo, multi-head attention
#page-transformer	Layer-by-layer architecture, BERT vs GPT, embedded video
#page-rlhf	SFT, Reward Model, PPO, KL divergence, embedded video
#page-hallucinations	Taxonomy, RAG, Chain-of-Thought mitigations
#page-lab	Live Tokenizer + Probability Waterfall demos
#page-videos	Netflix-style grid of six curated video lectures
#page-quiz	Eight assessed questions with instant feedback

Running Locally
# Clone or download the repository
git clone(https://ryth-07.github.io/neural-lens/)
cd neural-lens

# Option 1: Open directly
open index.html

# Option 2: Serve with Python (avoids file:// restrictions)
python3 -m http.server 8080
# Then open http://localhost:8080

No npm install. No build command. No environment variables.

Author
Built by a C RYTHAN at Amrita Vishwa Vidyapeetham as a UID capstone project. The goal: make machine learning architecture legible to anyone with a browser.

