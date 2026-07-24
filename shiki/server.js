// shiki-highlighter/server.js
import express from "express";
import { codeToHtml, getHighlighter } from "shiki";

// --- Konfiguration ---
const PORT = process.env.PORT || 3000; // Port für den Service
// Dual theme like shadcn (source.config.ts): vesper dark, github light.
const THEMES = { light: "github-light-default", dark: "github-dark-default" };
const LANGUAGES = [
  "templ",
  "go",
  "html",
  "css",
  "javascript",
  "js",
  "typescript",
  "ts",
  "json",
  "yaml",
  "bash",
  "shell",
  "markdown",
  "sql",
  "dockerfile",
  "python",
  "diff",
]; // Add more languages as needed
// --- Ende Konfiguration ---

const app = express();
// Middleware zum Parsen von JSON-Request-Bodies
app.use(express.json({ limit: "10mb" })); // Increase limit for potentially large code blocks

let highlighter;
let isHighlighterReady = false;

// Endpoint to check if the highlighter is ready
app.get("/healthz", (req, res) => {
  if (isHighlighterReady && highlighter) {
    res.status(200).send("OK");
  } else {
    res.status(503).send("Service Unavailable: Highlighter not ready");
  }
});

// Highlight Endpoint
// Positions of every highlight word occurrence as shiki decorations.
function wordDecorations(code, words) {
  if (!words || !words.length) return [];
  const decorations = [];
  const lines = code.split("\n");
  for (const word of words) {
    lines.forEach((lineText, lineIndex) => {
      let from = 0;
      while (true) {
        const at = lineText.indexOf(word, from);
        if (at === -1) break;
        decorations.push({
          start: { line: lineIndex, character: at },
          end: { line: lineIndex, character: at + word.length },
          properties: { "data-highlighted-chars": "" },
        });
        from = at + word.length;
      }
    });
  }
  return decorations;
}

app.post("/highlight", async (req, res) => {
  if (!isHighlighterReady || !highlighter) {
    console.warn("Highlight request received before highlighter was ready.");
    return res
      .status(503)
      .send("Highlighter service starting, please try again shortly.");
  }

  const { code, lang = "templ", highlightLines = [], highlightWords = [] } = req.body;

  if (typeof code !== "string") {
    return res
      .status(400)
      .send('Missing or invalid "code" field in request body.');
  }

  // Determine the language to use, falling back to 'text' if unsupported
  const effectiveLang = LANGUAGES.includes(lang) ? lang : "text";
  if (effectiveLang === "text" && lang !== "text") {
    console.warn(
      `Unsupported language requested: "${lang}". Falling back to plain text.`
    );
  }

  try {
    // console.log(`Highlighting ${code.length} chars, lang: ${effectiveLang}`);
    let html = await highlighter.codeToHtml(code, {
      lang: effectiveLang,
      themes: THEMES,
      defaultColor: "light",
      // rehype-pretty-code pendant: {4-6} line and /word/ char highlights
      // from the markdown fence meta.
      transformers: [
        {
          line(node, line) {
            // rehype-pretty-code keeps empty lines visible by giving them
            // a single space child.
            if (node.children.length === 0) {
              node.children = [{ type: "text", value: " " }];
            }
            if (highlightLines.includes(line)) node.properties["data-highlighted-line"] = "";
          },
        },
      ],
      decorations: wordDecorations(code, highlightWords),
    });
    // Newlines between the line spans break display:grid (anonymous items);
    // rehype-pretty-code strips them the same way.
    html = html.replaceAll("\n", "");
    // logInfo(`Sending response for lang: ${lang}`);
    res.status(200).type("text/html").send(html);
  } catch (error) {
    console.error(`Error highlighting code (lang: ${effectiveLang}): ${error}`);
    // Attempt to send plain text version as fallback on error
    try {
      const fallbackHtml = await highlighter.codeToHtml(code, {
        lang: "text",
        themes: THEMES,
        defaultColor: "light",
      });
      console.warn(
        `Highlighting failed for lang "${effectiveLang}", sending plain text fallback.`
      );
      res.status(200).type("text/html").send(fallbackHtml);
    } catch (fallbackError) {
      console.error(
        `Error during fallback plain text highlighting: ${fallbackError}`
      );
      res
        .status(500)
        .send("Internal Server Error during highlighting process.");
    }
  }
});

function getTimestamp() {
  const now = new Date();
  return now.toLocaleString("sv-SE", { hour12: false }).replace(/-/g, "/");
}

function logInfo(...args) {
  console.log(`${getTimestamp()} INFO:`, ...args);
}

function logError(...args) {
  console.error(`${getTimestamp()} ERROR:`, ...args);
}

// Server starten und Shiki initialisieren
const startServer = async () => {
  try {
    logInfo("Initializing Shiki highlighter...");
    highlighter = await getHighlighter({
      themes: Object.values(THEMES),
      langs: LANGUAGES,
    });
    isHighlighterReady = true;
    logInfo("Shiki highlighter initialized.");

    app.listen(PORT, () => {
      logInfo(`Shiki highlighter service listening on port ${PORT}`);
    });
  } catch (error) {
    logError("FATAL: Failed to initialize Shiki:", error);
    // Exit if Shiki cannot be initialized, as the service is useless otherwise
    process.exit(1);
  }
};

startServer();
