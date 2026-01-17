/**
 * Word2Vec Word Math Demo
 * Performs word arithmetic using pre-computed GloVe embeddings
 */

(function () {
  let embeddings = null;
  let wordList = null;

  // DOM elements
  let calculateBtn, resultsDiv, loadingDiv, errorDiv;

  /**
   * Load embeddings from JSON file
   */
  async function loadEmbeddings(path = "/data/embeddings.json") {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error("Failed to load embeddings");
      embeddings = await response.json();
      wordList = Object.keys(embeddings);
      return true;
    } catch (error) {
      console.error("Error loading embeddings:", error);
      return false;
    }
  }

  /**
   * Load extended vocabulary
   */
  async function loadExtendedVocabulary(e) {
    e.preventDefault();

    const vocabStatus = document.getElementById("vocab-status");
    const currentVocab = document.getElementById("current-vocab");
    const loadLink = document.getElementById("load-extended");

    vocabStatus.classList.add("loading");
    loadLink.textContent = "Loading...";

    const loaded = await loadEmbeddings("/data/embeddings-extended.json");

    if (loaded) {
      currentVocab.textContent = "20k words · 100d";
      loadLink.textContent = "Extended vocabulary loaded ✓";
      loadLink.style.pointerEvents = "none";
    } else {
      loadLink.textContent = "Failed to load. Try again?";
      vocabStatus.classList.remove("loading");
    }
  }

  /**
   * Get vector for a word
   */
  function getVector(word) {
    const normalized = word.toLowerCase().trim();
    return embeddings[normalized] || null;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Add two vectors
   */
  function addVectors(a, b) {
    return a.map((val, i) => val + b[i]);
  }

  /**
   * Subtract vector b from vector a
   */
  function subtractVectors(a, b) {
    return a.map((val, i) => val - b[i]);
  }

  /**
   * Find n nearest words to a given vector
   */
  function findNearest(vector, n = 5, exclude = []) {
    const excludeSet = new Set(exclude.map((w) => w.toLowerCase()));
    const similarities = [];

    for (const word of wordList) {
      if (excludeSet.has(word)) continue;

      const similarity = cosineSimilarity(vector, embeddings[word]);
      similarities.push({ word, similarity });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, n);
  }

  /**
   * Perform word math with dynamic terms
   * @param {Array} terms - Array of {word, op} objects
   */
  function computeWordMath(terms) {
    const usedWords = [];
    let resultVector = null;

    for (const term of terms) {
      const vector = getVector(term.word);
      if (!vector) {
        return { error: `Word not found: "${term.word}"` };
      }

      usedWords.push(term.word);

      if (resultVector === null) {
        resultVector = [...vector];
      } else {
        if (term.op === "+") {
          resultVector = addVectors(resultVector, vector);
        } else {
          resultVector = subtractVectors(resultVector, vector);
        }
      }
    }

    const nearest = findNearest(resultVector, 5, usedWords);
    return { results: nearest };
  }

  /**
   * Show error message
   */
  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    resultsDiv.style.display = "none";
  }

  /**
   * Hide error message
   */
  function hideError() {
    errorDiv.style.display = "none";
  }

  /**
   * Display results
   */
  function displayResults(results) {
    hideError();
    resultsDiv.innerHTML = results
      .map((r, i) => {
        const score = (r.similarity * 100).toFixed(1);
        return `<div class="word-result">
        <span class="word-rank">${i + 1}.</span>
        <span class="word-name">${r.word}</span>
        <span class="word-score">${score}%</span>
      </div>`;
      })
      .join("");
    resultsDiv.style.display = "block";
  }

  /**
   * Handle calculate button click
   */
  function handleCalculate() {
    const form = document.querySelector(".word-math-form");
    const children = Array.from(form.children).filter(
      (el) =>
        el.classList.contains("word-group") ||
        el.classList.contains("op-group"),
    );

    const terms = [];
    let currentOp = "+"; // First word is always added

    for (const child of children) {
      if (child.classList.contains("op-group")) {
        const opEl = child.querySelector(".math-op");
        currentOp = opEl.dataset.op;
      } else if (child.classList.contains("word-group")) {
        const input = child.querySelector("input");
        const word = input.value.trim();
        if (!word) {
          showError("Please fill in all word fields");
          return;
        }
        terms.push({ word, op: currentOp });
        currentOp = "+"; // Reset for next
      }
    }

    if (terms.length === 0) {
      showError("Please enter at least one word");
      return;
    }

    const result = computeWordMath(terms);

    if (result.error) {
      showError(result.error);
    } else {
      displayResults(result.results);
    }
  }

  /**
   * Toggle operation between + and -
   */
  function toggleOp(opEl) {
    const currentOp = opEl.dataset.op;
    const newOp = currentOp === "+" ? "-" : "+";
    opEl.dataset.op = newOp;
    opEl.textContent = newOp === "+" ? "+" : "−";
  }

  /**
   * Delete a word from the equation
   */
  function deleteWord(wordGroup) {
    const form = document.querySelector(".word-math-form");
    const allWordGroups = form.querySelectorAll(".word-group");

    // Don't delete if it's the only word left
    if (allWordGroups.length <= 1) return;

    // Find preceding or following op-group to remove
    const prevSibling = wordGroup.previousElementSibling;
    const nextSibling = wordGroup.nextElementSibling;

    // Remove the word group
    wordGroup.remove();

    // Remove the associated operator
    if (prevSibling && prevSibling.classList.contains("op-group")) {
      prevSibling.remove();
    } else if (nextSibling && nextSibling.classList.contains("op-group")) {
      nextSibling.remove();
    }
  }

  /**
   * Add a new word to the equation
   */
  function addWord() {
    const form = document.querySelector(".word-math-form");
    const addBtn = document.getElementById("add-word-btn");

    // Create new op-group
    const opGroup = document.createElement("span");
    opGroup.className = "op-group";
    opGroup.innerHTML = `
      <span class="math-op" data-op="+">+</span>
      <button type="button" class="op-toggle" title="Toggle +/−">↻</button>
    `;

    // Create new word-group
    const wordGroup = document.createElement("span");
    wordGroup.className = "word-group";
    wordGroup.innerHTML = `
      <input type="text" placeholder="word" autocomplete="off">
      <button type="button" class="word-delete" title="Remove">×</button>
    `;

    // Insert before add button
    form.insertBefore(opGroup, addBtn);
    form.insertBefore(wordGroup, addBtn);

    // Add event listeners to new elements
    opGroup.querySelector(".op-toggle").addEventListener("click", function () {
      const opEl = this.previousElementSibling;
      toggleOp(opEl);
    });

    wordGroup
      .querySelector(".word-delete")
      .addEventListener("click", function () {
        deleteWord(this.closest(".word-group"));
      });

    wordGroup.querySelector("input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleCalculate();
    });

    // Focus the new input
    wordGroup.querySelector("input").focus();
  }

  /**
   * Initialize the demo
   */
  async function init() {
    // Get DOM elements
    calculateBtn = document.getElementById("calculate-btn");
    resultsDiv = document.getElementById("results");
    loadingDiv = document.getElementById("loading");
    errorDiv = document.getElementById("error");

    // Check if elements exist (we're on the right page)
    if (!calculateBtn) return;

    // Load embeddings
    const loaded = await loadEmbeddings();

    if (loaded) {
      loadingDiv.style.display = "none";
      calculateBtn.disabled = false;

      // Add event listeners
      calculateBtn.addEventListener("click", handleCalculate);

      // Toggle button listeners
      document.querySelectorAll(".op-toggle").forEach((btn) => {
        btn.addEventListener("click", function () {
          const opEl = this.previousElementSibling;
          toggleOp(opEl);
        });
      });

      // Delete button listeners
      document.querySelectorAll(".word-delete").forEach((btn) => {
        btn.addEventListener("click", function () {
          deleteWord(this.closest(".word-group"));
        });
      });

      // Add word button listener
      document
        .getElementById("add-word-btn")
        .addEventListener("click", addWord);

      // Allow Enter key to trigger calculation on any input
      document.querySelectorAll(".word-math-form input").forEach((input) => {
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") handleCalculate();
        });
      });

      // Load extended vocabulary link
      document
        .getElementById("load-extended")
        .addEventListener("click", loadExtendedVocabulary);
    } else {
      loadingDiv.textContent = "Failed to load vocabulary. Please refresh.";
    }
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
