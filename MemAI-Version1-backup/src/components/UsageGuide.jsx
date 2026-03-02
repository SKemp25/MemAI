import { useState } from 'react';
import './UsageGuide.css';

export function UsageGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`usage-guide ${open ? 'usage-guide-open' : ''}`} role="group" aria-label="Usage guide">
      <button
        type="button"
        className="usage-guide-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="usage-guide-label">Guide</span>
        <span className="usage-guide-chevron" aria-hidden>{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div className="usage-guide-content">
          <ul className="usage-guide-list">
            <li><strong>Conversations</strong> — Tap <strong>+ New</strong> to add a conversation (paste content, set category and tags).</li>
            <li><strong>Open a conversation</strong> — Use <strong>Summarize</strong> for a quick or AI summary; <strong>Recommendations</strong> to extract names, books, movies, recipes, links.</li>
            <li><strong>Highlighted text</strong> — Select text in the full conversation, then <strong>Add selection to Recommendations</strong>.</li>
            <li><strong>Recommendations tab</strong> — Filter by category or “Highlighted text only”, sort (newest, A–Z, etc.), search by keyword.</li>
            <li><strong>Summary tab</strong> — Add an OpenAI API key for AI summaries (optional).</li>
            <li><strong>Color palette</strong> — On Conversations only: Chill, Warm, High contrast, or Custom.</li>
            <li><strong>Security & backup</strong> — Set a PIN to lock the app. Export your data and save the file to your device or cloud (e.g. iCloud, Google Drive) so you don’t lose it; use Import to restore.</li>
          </ul>
          <p className="usage-guide-footer">All data is stored on this device only. Export regularly to back up.</p>
        </div>
      )}
    </div>
  );
}
