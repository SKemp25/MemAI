import { useState } from 'react';
import { getApiKey, setApiKey } from '../services/summaryApi';
import { linkifyContent } from '../utils/linkify';
import './SummaryView.css';

export function SummaryView({
  conversations,
  onSelectConversation,
  onSummarize,
  summarizingId,
  summarizeError,
  clearSummarizeError,
}) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(!getApiKey());

  const handleSaveKey = (e) => {
    e.preventDefault();
    setApiKey(apiKeyInput.trim());
    setApiKeyInput('');
    setShowKeyForm(false);
    clearSummarizeError?.();
  };

  const handleChangeKey = () => {
    setApiKey('');
    setApiKeyInput('');
    setShowKeyForm(true);
    clearSummarizeError?.();
  };

  const hasKey = getApiKey();

  return (
    <article className="summary-view">
      <header>
        <h1>Summaries</h1>
      </header>

      {!hasKey && (
        <section className="api-key-section">
          <p className="api-key-hint">
            <strong>Summarize works without an account</strong>—you get a short preview from the start of the text. Optionally add an OpenAI API key below for AI-written summaries (uses your OpenAI plan; key stored only on this device).
          </p>
          {showKeyForm ? (
            <form onSubmit={handleSaveKey} className="api-key-form">
              <input
                type="password"
                placeholder="OpenAI API key (sk-…)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="api-key-input"
                autoComplete="off"
              />
              <button type="submit" className="btn-primary" disabled={!apiKeyInput.trim()}>
                Save key
              </button>
            </form>
          ) : (
            <p className="api-key-saved">
              API key is set.{' '}
              <button type="button" className="btn-link" onClick={handleChangeKey}>
                Change API key
              </button>
            </p>
          )}
        </section>
      )}

      {hasKey && (
        <p className="summary-view-hint">
          With an API key set, <strong>Summarize</strong> uses AI. You can also use it without a key for a quick preview. Open a conversation or use the buttons below.
        </p>
      )}

      {summarizeError && (
        <p className="summary-view-error" role="alert">
          {summarizeError}
        </p>
      )}

      <ul className="summary-list">
        {conversations.length === 0 && (
          <li className="empty">No conversations yet. Save one from the Conversations tab.</li>
        )}
        {conversations.map((c) => (
          <li key={c.id} className="summary-list-item">
            <button
              type="button"
              className="summary-item-title"
              onClick={() => onSelectConversation(c.id)}
            >
              {c.title}
            </button>
            {c.summary ? (
              <p className="summary-item-text">{linkifyContent(c.summary)}</p>
            ) : (
              <p className="summary-item-placeholder">No summary yet.</p>
            )}
            {c.content?.trim() && (
              <button
                type="button"
                className="btn-small"
                onClick={() => onSummarize(c.id)}
                disabled={summarizingId === c.id}
              >
                {summarizingId === c.id ? 'Summarizing…' : 'Summarize'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}
