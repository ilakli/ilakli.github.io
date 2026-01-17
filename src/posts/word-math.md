---
layout: post.liquid
title: "Word Math: The Forgotten Art of Word2Vec"
description: "Rediscovering word embeddings in the age of LLMs and using them to find new names"
pubDate: 2025-01-17
tags: [posts, ml, interactive]
---

In the rush toward ever-larger language models, we've started forgetting the elegant ideas that came before. Word2Vec and GloVe from 2013-2014 showed us something remarkable: words can be represented as vectors, and you can do _arithmetic_ with meaning. By training a model to predict neighboring words it learns to encode semantics like gender, royalty, geography, as directions in space.

**king - man + woman = queen**

This still feels like magic. The vector difference between "king" and "man" captures _royalty_, and adding that to "woman" lands you near "queen." No trillion-parameter model needed just linear algebra on patterns learned from text.

## Why This Matters Now

Everyone is building things. The barrier to shipping has never been lower. But with more creators comes a familiar problem: _naming is hard_. Every good word feels taken.

What if you could blend concepts mathematically? Take the essence of one idea, subtract what you don't want, add what you do. That's what this tool lets you explore not just the classic analogies, but new combinations that might spark something useful.

**startup - business + art = ?**

**minimal - less + warm = ?**

Try it. You might find a name, a concept, or at least a new way of thinking about the problem.

<div id="word-math-demo">
  <div id="loading">Loading vocabulary...</div>
  <div id="error" style="display: none;"></div>

  <div class="word-math-form" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin: 1.5rem 0;">
    <span class="word-group">
      <input type="text" id="word1" placeholder="king" autocomplete="off">
      <button type="button" class="word-delete" title="Remove">×</button>
    </span>
    <span class="op-group">
      <span class="math-op" data-op="-">−</span>
      <button type="button" class="op-toggle" title="Toggle +/−">↻</button>
    </span>
    <span class="word-group">
      <input type="text" id="word2" placeholder="man" autocomplete="off">
      <button type="button" class="word-delete" title="Remove">×</button>
    </span>
    <span class="op-group">
      <span class="math-op" data-op="+">+</span>
      <button type="button" class="op-toggle" title="Toggle +/−">↻</button>
    </span>
    <span class="word-group">
      <input type="text" id="word3" placeholder="woman" autocomplete="off">
      <button type="button" class="word-delete" title="Remove">×</button>
    </span>
    <button type="button" id="add-word-btn" title="Add word">+</button>
    <button id="calculate-btn" disabled>Calculate</button>
  </div>

  <div id="results" style="display: none;"></div>

  <div id="vocab-status">
    <span id="current-vocab">10k words</span> ·
    <a href="#" id="load-extended">Load extended vocabulary (20k words, ~5MB)</a>
  </div>
</div>

<style>
  #word-math-demo {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
  }

  #loading {
    color: var(--text-light);
    font-style: italic;
  }

  #error {
    color: #c0392b;
    padding: 0.75rem;
    background: #fdf2f2;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .word-group {
    position: relative;
    display: inline-flex;
  }


  .word-math-form input {
    font-family: var(--font-body);
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 3px;
    width: 100px;
    background: var(--background);
  }

  .word-math-form input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .word-delete {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 0.7rem;
    width: 14px;
    height: 14px;
    padding: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 50%;
    color: var(--text-light);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    line-height: 1;
  }

  .word-group:hover .word-delete {
    opacity: 1;
  }

  .word-delete:hover {
    border-color: #c0392b;
    color: #c0392b;
  }

  #add-word-btn {
    font-size: 1rem;
    width: 28px;
    height: 28px;
    padding: 0;
    background: none;
    border: 1px dashed var(--border);
    border-radius: 3px;
    color: var(--text-light);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #add-word-btn:hover {
    border-color: var(--accent);
    border-style: solid;
    color: var(--accent);
  }

  .op-group {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .math-op {
    font-size: 1.25rem;
    color: var(--text-light);
    padding: 0 0.25rem;
    min-width: 1.5rem;
    text-align: center;
  }

  .op-toggle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.7rem;
    width: 18px;
    height: 18px;
    padding: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 50%;
    color: var(--text-light);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
  }

  .op-group:hover .op-toggle {
    opacity: 1;
  }

  .op-toggle:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  #calculate-btn {
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

  #calculate-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  #calculate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  #results {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  #vocab-status {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: var(--text-light);
  }

  #vocab-status a {
    color: var(--accent);
    text-decoration: none;
  }

  #vocab-status a:hover {
    text-decoration: underline;
  }

  #vocab-status.loading a {
    pointer-events: none;
    opacity: 0.5;
  }

  .word-result {
    display: flex;
    align-items: baseline;
    padding: 0.4rem 0;
    font-size: 1.05rem;
  }

  .word-rank {
    color: var(--text-light);
    width: 1.5rem;
    font-size: 0.9rem;
  }

  .word-name {
    font-weight: 500;
    flex: 1;
  }

  .word-score {
    color: var(--text-light);
    font-size: 0.9rem;
    font-family: var(--font-heading);
  }

  @media (max-width: 500px) {
    .word-math-form {
      flex-direction: column;
      align-items: stretch !important;
    }

    .word-math-form input {
      width: 100%;
    }

    .math-op {
      text-align: center;
      padding: 0.25rem 0;
    }

    #calculate-btn {
      margin-top: 0.5rem;
    }
  }
</style>

<script src="/js/word2vec.js"></script>

## Ideas to Explore

Classic analogies that still impress:

- **king − man + woman** → queen, princess, monarch
- **paris − france + italy** → rome, milan, venice

But try thinking generatively:

- **coffee − bitter + sweet** → ?
- **cloud − sky + ocean** → ?
- **zen − buddhism + work** → ?

The results won't always be perfect—these are 2014-era embeddings, not GPT. But sometimes the imperfection is the point. The unexpected suggestion might be exactly what you needed.

## The Forgotten Elegance

Before transformers ate the world, researchers discovered that training a simple neural network to predict neighboring words would produce vectors where semantic relationships emerged as geometric directions. No one told the model that "king" and "queen" were related it learned that from context alone.

The remarkable thing: the training objective was just "predict the next word." But as a byproduct, the vectors learned to encode _meaning_. Gender, tense, geography, sentiment, these semantic dimensions emerge naturally from patterns in how words appear together. The model wasn't taught that "Paris" is to "France" as "Rome" is to "Italy." It discovered that relationship by observing millions of sentences.

This is what we risk losing in the LLM era: appreciation for minimal, interpretable systems. A 5MB file of vectors, running entirely in your browser, capturing something real about how language works. No API calls, no rate limits, no prompt engineering.

## Under the Hood

The vectors come from [Stanford's GloVe project](https://nlp.stanford.edu/projects/glove/) trained on 6 billion words of text. Each word becomes a point in 50-dimensional space (or 100d if you load the extended vocabulary). Finding "queen" from "king - man + woman" is just: compute the result vector, then find which word vectors are closest using cosine similarity.

That's it. The entire algorithm fits in your head.

---

_Built with GloVe embeddings. All computation happens client-side your words never leave your browser._
