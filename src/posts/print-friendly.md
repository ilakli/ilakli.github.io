---
layout: post.liquid
title: "Print-Friendly: Clean Blog Posts for Paper"
description: "Paste a blog post URL and get a clean, printable version — no nav bars, no clutter, just content"
pubDate: 2026-03-10
tags: [posts, tools, interactive]
---

Long blog posts are best read on paper — but printing a web page gives you nav bars,
cookie banners, sidebars, and broken layouts. This tool strips all that away.

Paste any blog post URL below. It extracts the article content, re-renders math and
code blocks, and gives you a clean print layout. Hit print and you get something that
looks like it belongs in a book, not a browser.

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
    <iframe id="preview-frame" sandbox="allow-same-origin allow-scripts"></iframe>
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
