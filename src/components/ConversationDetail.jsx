import { linkifyContent } from '../utils/linkify';
import { getLinkDisplayText } from '../services/recommendationsApi';
import './ConversationDetail.css';

const RECO_TYPE_LABELS = { name: 'Name', book: 'Book', movie: 'Movie', recipe: 'Recipe', link: 'Link', highlight: 'Highlighted text' };

export function ConversationDetail({
  conversation,
  categories,
  tags,
  recommendations = [],
  onBack,
  onEdit,
  onDelete,
  onSummarize,
  onExtractRecommendations,
  onDeleteRecommendation,
  onAddHighlightRecommendation,
  summarizing = false,
  summarizeError = null,
  extractingRecommendations = false,
  recommendationsError = null,
}) {
  if (!conversation) return null;

  const categoryName = conversation.categoryId && categories?.find((c) => c.id === conversation.categoryId)?.name;
  const tagNames = (conversation.tagIds || [])
    .map((id) => tags?.find((t) => t.id === id)?.name)
    .filter(Boolean);

  const hasContent = conversation.content?.trim();

  return (
    <article className="conversation-detail">
      <header>
        <button type="button" className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary btn-edit"
            onClick={() => onEdit()}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (confirm('Delete this conversation?')) {
                onDelete(conversation.id);
                onBack();
              }
            }}
          >
            Delete
          </button>
        </div>
      </header>
      <h1>{conversation.title}</h1>
      <p className="conversation-meta">
        {new Date(conversation.createdAt).toLocaleString()}
        {categoryName && (
          <span className="conversation-detail-category"> · {categoryName}</span>
        )}
        {tagNames.length > 0 && (
          <span className="conversation-detail-tags"> · {tagNames.join(', ')}</span>
        )}
      </p>

      <section className="summary-section">
        <h2>
          Summary
          {hasContent && (
            <>
              <button
                type="button"
                className="btn-small"
                onClick={() => onSummarize()}
                disabled={summarizing}
              >
                {summarizing ? 'Summarizing…' : 'Summarize'}
              </button>
              <button
                type="button"
                className="btn-small"
                onClick={() => onExtractRecommendations?.()}
                disabled={extractingRecommendations}
              >
                {extractingRecommendations ? 'Extracting…' : 'Recommendations'}
              </button>
            </>
          )}
        </h2>
        {(summarizeError || recommendationsError) && (
          <p className="summary-error" role="alert">
            {summarizeError || recommendationsError}
          </p>
        )}
        {conversation.summary ? (
          <div className="summary-content">
            {linkifyContent(conversation.summary)}
            {conversation.summarizedAt && (
              <p className="summary-meta">
                {conversation.summarySource === 'ai' ? 'AI summary' : 'Quick preview'}
                {' · '}
                {new Date(conversation.summarizedAt).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <p className="summary-placeholder">
            {hasContent
              ? 'Click Summarize for a quick preview (no account). Add an OpenAI key in the Summary tab for AI summaries.'
              : 'Add content above, then click Summarize.'}
          </p>
        )}
      </section>

      {recommendations.length > 0 && (
        <section className="recommendations-section">
          <h3 className="content-heading">Recommendations from this conversation</h3>
          <ul className="recommendations-list-detail">
            {recommendations.map((r) => (
              <li key={r.id} className={`recommendation-item-detail type-${r.type}`}>
                <span className="rec-type-badge">{RECO_TYPE_LABELS[r.type] || r.type}</span>
                <span className="rec-content">
                  {r.url ? (
                    <>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="content-link">
                        {getLinkDisplayText(r)}
                      </a>
                      <span className="rec-url-secondary" title={r.url}>{r.url}</span>
                    </>
                  ) : (
                    <span className="rec-text">{r.text}</span>
                  )}
                </span>
                {onDeleteRecommendation && (
                  <button
                    type="button"
                    className="btn-remove-rec"
                    onClick={() => onDeleteRecommendation(r.id)}
                    aria-label="Remove from Recommendations"
                    title="Remove from Recommendations"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="conversation-content">
        <div className="conversation-content-header">
          <h3 className="content-heading">Full conversation</h3>
          {conversation.content && onAddHighlightRecommendation && (
            <button
              type="button"
              className="btn-small btn-add-highlight"
              onClick={() => {
                const text = window.getSelection()?.toString?.()?.trim() ?? '';
                if (text) {
                  onAddHighlightRecommendation(text);
                  window.getSelection()?.removeAllRanges?.();
                }
              }}
              title="Select text in the conversation below, then click to add it to Recommendations"
            >
              Add selection to Recommendations
            </button>
          )}
        </div>
        {conversation.content ? (
          <pre>{linkifyContent(conversation.content)}</pre>
        ) : (
          <p className="empty-content">No content saved.</p>
        )}
      </div>
    </article>
  );
}
