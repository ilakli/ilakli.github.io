---
layout: post.liquid
title: "Print-Friendly: Clean Blog Posts for Paper"
description: "Paste a blog post URL and get a clean, printable version with no nav bars, no clutter, just content"
pubDate: 2026-03-10
tags: [posts, tools, interactive]
---

Some of the best technical writing today lives on blogs, posts that rival research papers in depth and deserve the same careful reading. But screens are distracting, and deep reading still works best on paper.

The problem is that printing a blog post gives you nav bars, cookie banners, sidebars, and broken layouts. Half the pages are clutter.

This is a small tool to fix that. Paste a URL, and it extracts just the article (text, math, code, images) and renders it in a clean, tight layout meant for paper.

**Try it with:** `https://lilianweng.github.io/posts/2021-07-11-diffusion-models/`

<div id="print-tool">
  <div class="print-tool-input">
    <input type="url" id="url-input" placeholder="https://example.com/blog-post" autocomplete="off">
    <button id="fetch-btn">Convert</button>
  </div>
  <div id="status" style="display: none;"></div>
  <div id="preview-container" style="display: none;">
    <div class="preview-controls">
      <button id="print-btn">Print / Save as PDF</button>
    </div>
    <iframe id="preview-frame" sandbox="allow-same-origin allow-scripts allow-modals"></iframe>
  </div>
</div>

<style>
  #print-tool {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
  }

  .print-tool-input {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .print-tool-input input {
    font-family: var(--font-body);
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--background);
    flex: 1;
  }

  .print-tool-input input:focus {
    outline: none;
    border-color: var(--accent);
  }

  #fetch-btn, #print-btn {
    font-family: var(--font-heading);
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  #fetch-btn:hover, #print-btn:hover {
    background: var(--accent-hover);
  }

  #status {
    padding: 0.75rem;
    margin-top: 1rem;
    font-style: italic;
    color: var(--text-light);
  }

  #status.error {
    color: #c0392b;
    background: #fdf2f2;
    border-radius: 4px;
  }

  .preview-controls {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  #preview-frame {
    width: 100%;
    height: 80vh;
    border: 1px solid var(--border);
    border-radius: 4px;
  }

  @media (max-width: 500px) {
    .print-tool-input {
      flex-direction: column;
      align-items: stretch;
    }

    .print-tool-input input {
      width: 100%;
    }

    #fetch-btn {
      width: 100%;
      margin-top: 0.5rem;
    }
  }
</style>

<script src="https://cdn.jsdelivr.net/npm/@mozilla/readability@0.5.0/Readability.js"></script>
<script src="/js/print-friendly.js"></script>

## How It Works

The tool fetches the page through a [CORS proxy](https://corsproxy.io), then runs Mozilla's [Readability.js](https://github.com/mozilla/readability), the same library Firefox uses for its Reader View, to extract just the article content. Nav bars, sidebars, comment sections, cookie banners, and other clutter get stripped away.

The extracted content is rendered in an iframe with a print-optimized stylesheet: tight margins, serif typography, proper page breaks. Math expressions are re-rendered with [KaTeX](https://katex.org) so LaTeX-heavy posts (common in ML blogs) come through cleanly.

## Limitations

- **CORS restrictions**: Some sites block proxy requests. If a URL fails, the site's server is rejecting the fetch.
- **Dynamic content**: Pages that load content via JavaScript after the initial HTML won't extract well. Readability works on the raw HTML.
- **Very custom layouts**: Sites with unusual markup may not extract perfectly. Readability is good but not magic.

---

_All processing happens in your browser. URLs are fetched through a public CORS proxy but no content is stored or sent anywhere else._
