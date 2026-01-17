#!/usr/bin/env node
/**
 * Script to convert GloVe embeddings to JSON format
 *
 * Usage:
 *   node scripts/prepare-embeddings.js <input-file> <max-words> <output-name>
 *
 * Examples:
 *   node scripts/prepare-embeddings.js glove.6B.50d.txt 10000 embeddings
 *   node scripts/prepare-embeddings.js glove.6B.100d.txt 20000 embeddings-extended
 */

import { createReadStream, writeFileSync, statSync } from "fs";
import { createInterface } from "readline";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function processGloveFile(inputPath, maxWords, expectedDim) {
  const embeddings = {};
  let count = 0;

  const fileStream = createReadStream(inputPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  console.log(`Processing ${inputPath}...`);
  console.log(`Target: ${maxWords} words`);

  for await (const line of rl) {
    if (count >= maxWords) break;

    const parts = line.split(" ");
    const word = parts[0];

    // Skip words with non-ASCII characters or numbers-only
    if (!/^[a-z]+$/i.test(word)) continue;

    // Convert to lowercase for consistency
    const lowerWord = word.toLowerCase();

    // Skip if we already have this word (case variation)
    if (embeddings[lowerWord]) continue;

    const vector = parts.slice(1).map(Number);

    // Verify vector dimension
    if (expectedDim && vector.length !== expectedDim) continue;

    // Round to 4 decimal places to reduce file size
    embeddings[lowerWord] = vector.map((v) => Math.round(v * 10000) / 10000);
    count++;

    if (count % 5000 === 0) {
      console.log(`Processed ${count} words...`);
    }
  }

  console.log(`Total words processed: ${count}`);
  return embeddings;
}

async function main() {
  const inputPath = process.argv[2];
  const maxWords = parseInt(process.argv[3]) || 10000;
  const outputName = process.argv[4] || "embeddings";

  if (!inputPath) {
    console.log(
      "Usage: node prepare-embeddings.js <input-file> <max-words> <output-name>",
    );
    console.log("");
    console.log("Examples:");
    console.log(
      "  node scripts/prepare-embeddings.js glove.6B.50d.txt 10000 embeddings",
    );
    console.log(
      "  node scripts/prepare-embeddings.js glove.6B.100d.txt 20000 embeddings-extended",
    );
    process.exit(1);
  }

  // Detect dimension from filename
  const dimMatch = inputPath.match(/(\d+)d/);
  const expectedDim = dimMatch ? parseInt(dimMatch[1]) : null;

  try {
    const embeddings = await processGloveFile(inputPath, maxWords, expectedDim);

    const outputPath = join(
      __dirname,
      "..",
      "src",
      "data",
      `${outputName}.json`,
    );
    writeFileSync(outputPath, JSON.stringify(embeddings));

    const stats = {
      words: Object.keys(embeddings).length,
      dimensions: expectedDim || "unknown",
      sampleWords: Object.keys(embeddings).slice(0, 10),
    };

    console.log("\nOutput written to:", outputPath);
    console.log("Statistics:", JSON.stringify(stats, null, 2));

    const fileStats = statSync(outputPath);
    console.log(`File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
