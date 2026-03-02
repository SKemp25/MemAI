# ChatGPT Convo Tracker

A simple web app to keep and track conversations and recommendations from ChatGPT or Gemini. Store pasted conversations, add categories and tags, summarize, extract recommendations (names, books, movies, recipes, links), and save highlighted text. All data stays on your device.

## Features

- **Conversations** – Save conversations with title, content, category, and tags. Summarize (local or with OpenAI). Extract recommendations or add highlighted text as recommendations.
- **Recommendations** – View all recommendations; filter by category or “Highlighted text only”; sort (newest, oldest, A–Z, Z–A); keyword search.
- **Summary** – Optional OpenAI API key for AI summaries; quick local preview otherwise.
- **Color palette** – Chill, Warm, High contrast, or Custom (color picker); shown on Conversations only.
- **Local storage** – Data is stored in your browser only; nothing is sent to a server except optional OpenAI calls.

---

## Testing on phone, tablet, or laptop

### Laptop (same machine)

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173`).

### Phone or tablet (same Wi‑Fi)

1. On your **laptop**, run:
   ```bash
   npm run dev
   ```
2. In the terminal, Vite prints both:
   - **Local:** `http://localhost:5173`
   - **Network:** `http://192.168.x.x:5173` (your machine’s IP)
3. On your **phone or tablet**, connect to the **same Wi‑Fi** as the laptop, then open the **Network** URL in the browser (e.g. `http://192.168.1.5:5173`).
4. If it doesn’t load, check that your laptop firewall allows incoming connections on port 5173.

Data is stored **per device and per browser** in localStorage. Testing on phone vs laptop uses separate data unless you deploy the app and use the same URL on both.

---

## Data storage

Everything is stored in the browser’s **localStorage** (no server database).

| Key | Contents |
|-----|----------|
| `chatgpt-convo-tracker` | Main app data: `conversations`, `recommendations`, `categories`, `tags` as JSON. |
| `chatgpt-convo-tracker-theme` | Current palette: `default`, `warm`, `high-contrast`, or `custom`. |
| `chatgpt-convo-tracker-custom-accent` | Custom accent colour (hex) when theme is Custom. |

- **Conversations**: title, content, categoryId, tagIds, summary, summarizedAt, summarySource, createdAt, id.
- **Recommendations**: conversationId, type (name, book, movie, recipe, link, highlight), text, url, createdAt, id.
- **Categories / tags**: id, name (and category color). Default categories are used if none saved.

Data is loaded once on app start and saved whenever you add, edit, or delete. Clearing site data or using a different browser/device clears or isolates this data.

---

## Run locally

```bash
cd chatgpt-convo-tracker
npm install
npm run dev
```

Open the URL shown (use the **Network** URL to test from another device on the same Wi‑Fi).

## Build for production

```bash
npm run build
```

Output is in `dist/`. Serve that folder with any static host (e.g. Netlify, Vercel). Data will still be per-browser localStorage.

## Tech stack

- React 19 + Vite 7
- No backend; data persists in `localStorage`

## Project structure

- `src/data/store.js` – Load/save and ID helpers for localStorage; theme and custom accent keys.
- `src/hooks/useStore.js` – React hook for conversations, recommendations, categories, tags.
- `src/components/` – Conversation list/detail, Add conversation, Recommendations view, Summary view, Theme switcher.
