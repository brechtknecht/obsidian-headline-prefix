/*
 * Section Prefix Plugin for Obsidian
 * Parses headings like "2.3 Lists" and renders the numeric prefix small,
 * keeping the actual title text at full heading size.
 *
 * Handles both:
 *   - .inline-title  (the big filename-based note title)
 *   - h1–h6          (headings inside the note body)
 */

'use strict';

const { Plugin } = require('obsidian');

// Matches: "2.3 Lists", "0. Start", "1. What is FieteOS", "3.1.2 Something"
const PREFIX_RE = /^(\d+(?:\.\d+)*\.?)\s+(.+)$/s;

const STYLE_ID = 'section-prefix-styles';

const CSS = `
/* ── Section Prefix Plugin ─────────────────────────────── */

/* Give headings and inline-title a positioning context */
h1, h2, h3, h4, h5, h6, .inline-title {
  position: relative;
}

.sp-prefix {
  position: absolute;
  bottom: 100%;
  left: 0;
  padding-top: 0.4em;

  font-size: 0.28em;
  font-weight: 400;
  opacity: 0.38;
  letter-spacing: 0.05em;
  line-height: 1;
  font-style: normal;
  font-family: inherit;
  white-space: nowrap;

  user-select: none;
  -webkit-user-select: none;
}
`;

function processEl(el) {
  if (!el) return;
  // Already processed
  if (el.querySelector(':scope > .sp-prefix')) return;

  const text = el.textContent.trim();
  const match = text.match(PREFIX_RE);
  if (!match) return;

  const [, prefix, title] = match;

  // Clear and rebuild
  while (el.firstChild) el.removeChild(el.firstChild);

  // "0." prefix: show title only, no badge
  if (prefix === '0.' || prefix === '0') {
    el.appendChild(document.createTextNode(title));
    return;
  }

  const prefixSpan = document.createElement('span');
  prefixSpan.className = 'sp-prefix';
  prefixSpan.textContent = prefix;

  el.appendChild(prefixSpan);
  el.appendChild(document.createTextNode(title));
}

function processContainer(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  root.querySelectorAll('.inline-title').forEach(processEl);
  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(processEl);
}

module.exports = class SectionPrefixPlugin extends Plugin {
  async onload() {
    this.injectStyles();

    // ── Reading-view post-processor (new notes / navigation) ──
    this.registerMarkdownPostProcessor((el) => {
      el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(processEl);
    });

    // ── MutationObserver for inline-title + dynamic rendering ──
    this._observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // KEY FIX: check the mutation target itself.
        // Obsidian adds .inline-title to DOM empty, then sets its text later
        // (adding a text node child). That childList mutation fires on the
        // .inline-title element as `m.target` — not as an added element node.
        const target = m.target;
        if (target.nodeType === Node.ELEMENT_NODE) {
          if (target.classList.contains('inline-title') || /^H[1-6]$/.test(target.tagName)) {
            processEl(target);
            continue;
          }
        }

        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.classList.contains('inline-title')) {
            processEl(node);
          } else if (/^H[1-6]$/.test(node.tagName)) {
            processEl(node);
          } else {
            processContainer(node);
          }
        }
      }
    });

    this._observer.observe(document.body, { childList: true, subtree: true });

    // ── Process after layout is ready (DOM is fully rendered) ──
    this.app.workspace.onLayoutReady(() => processContainer(document.body));
  }

  onunload() {
    this._observer?.disconnect();
    document.getElementById(STYLE_ID)?.remove();

    // Restore original text in all processed elements
    document.querySelectorAll('.sp-prefix').forEach(span => {
      const parent = span.parentElement;
      if (!parent) return;
      const prefix = span.textContent;
      let rest = '';
      parent.childNodes.forEach(node => {
        if (node !== span) rest += node.textContent;
      });
      parent.textContent = prefix + ' ' + rest;
    });
  }

  injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
};
