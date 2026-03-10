// print-friendly.js — Fetch, extract, and render clean printable articles

async function fetchArticle(url) {
  const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch article (HTTP ${response.status})`);
  }
  return await response.text();
}

function fixRelativeUrls(doc, baseUrl) {
  // Ensure base URL ends with / so relative paths resolve to the page directory
  if (!baseUrl.endsWith("/")) {
    baseUrl += "/";
  }
  doc.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    if (src && !src.startsWith("http") && !src.startsWith("data:")) {
      try {
        img.setAttribute("src", new URL(src, baseUrl).href);
      } catch (e) {
        /* ignore invalid URLs */
      }
    }
  });
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (
      href &&
      !href.startsWith("http") &&
      !href.startsWith("#") &&
      !href.startsWith("mailto:") &&
      !href.startsWith("javascript:")
    ) {
      try {
        a.setAttribute("href", new URL(href, baseUrl).href);
      } catch (e) {
        /* ignore invalid URLs */
      }
    }
  });
}

function extractContent(html, sourceUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Fix relative URLs before Readability processes the document
  fixRelativeUrls(doc, sourceUrl);

  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article) {
    throw new Error(
      "Could not extract article content. The page may not contain a recognizable article.",
    );
  }

  return {
    title: article.title,
    byline: article.byline,
    content: article.content,
  };
}

function renderInIframe(iframe, { title, byline, content }) {
  const bylineHtml = byline ? `<p class="byline">${byline}</p>` : "";

  const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
  <style>
body {
  font-family: 'Georgia', 'Times New Roman', serif;
  max-width: 680px;
  margin: 2rem auto;
  padding: 0 1rem;
  color: #1a1a1a;
  line-height: 1.7;
  font-size: 11pt;
}
h1 { font-size: 1.8em; margin-bottom: 0.3em; }
h2 { font-size: 1.4em; margin-top: 1.5em; }
h3 { font-size: 1.2em; }
img { max-width: 100%; height: auto; }
pre {
  background: #f5f5f5;
  padding: 0.8em;
  overflow-x: auto;
  font-size: 0.85em;
  border: 1px solid #ddd;
  border-radius: 3px;
}
code { font-size: 0.9em; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 0.5em; text-align: left; }
blockquote {
  border-left: 3px solid #ccc;
  margin-left: 0;
  padding-left: 1em;
  color: #555;
}
.byline { color: #666; font-style: italic; margin-bottom: 1.5em; }
@media print {
  body { margin: 0; padding: 0; font-size: 10pt; }
  a { color: inherit; text-decoration: none; }
  pre, img, table, blockquote { break-inside: avoid; }
  h2, h3 { break-after: avoid; }
}
  </style>
</head>
<body>
  <article>
    <h1>${title || "Untitled"}</h1>
    ${bylineHtml}
    ${content}
  </article>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\\\[', right: '\\\\]', display: true},
            {left: '\\\\(', right: '\\\\)', display: false},
          ],
          throwOnError: false
        });
      }
    });
  <\/script>
</body>
</html>`;

  iframe.srcdoc = htmlDoc;
}

// --- UI wiring ---

document.addEventListener("DOMContentLoaded", function () {
  const urlInput = document.getElementById("url-input");
  const fetchBtn = document.getElementById("fetch-btn");
  const status = document.getElementById("status");
  const previewContainer = document.getElementById("preview-container");
  const previewFrame = document.getElementById("preview-frame");
  const printBtn = document.getElementById("print-btn");

  function showStatus(msg, isError) {
    status.style.display = "block";
    status.textContent = msg;
    if (isError) {
      status.classList.add("error");
    } else {
      status.classList.remove("error");
    }
  }

  function clearStatus() {
    status.style.display = "none";
    status.textContent = "";
    status.classList.remove("error");
  }

  function isValidUrl(str) {
    try {
      const u = new URL(str);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleConvert() {
    const url = urlInput.value.trim();
    if (!isValidUrl(url)) {
      showStatus(
        "Please enter a valid URL (starting with http:// or https://).",
        true,
      );
      return;
    }

    previewContainer.style.display = "none";
    fetchBtn.disabled = true;

    try {
      showStatus("Fetching article...", false);
      const html = await fetchArticle(url);

      showStatus("Extracting content...", false);
      const article = extractContent(html, url);

      showStatus("Rendering preview...", false);
      renderInIframe(previewFrame, article);

      // Wait for iframe to load before showing
      previewFrame.onload = function () {
        clearStatus();
        previewContainer.style.display = "block";
      };
    } catch (err) {
      showStatus(
        err.message || "Something went wrong. Please try a different URL.",
        true,
      );
      previewContainer.style.display = "none";
    } finally {
      fetchBtn.disabled = false;
    }
  }

  fetchBtn.addEventListener("click", handleConvert);

  urlInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      handleConvert();
    }
  });

  printBtn.addEventListener("click", function () {
    previewFrame.contentWindow.print();
  });
});
