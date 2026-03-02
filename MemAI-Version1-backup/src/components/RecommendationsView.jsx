import { useState, useMemo } from 'react';
import { titleFromUrl, getLinkDisplayText } from '../services/recommendationsApi';
import './RecommendationsView.css';

const TYPE_LABELS = { name: 'Name', book: 'Book', movie: 'Movie', recipe: 'Recipe', link: 'Link', highlight: 'Highlighted text' };

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'a-z', label: 'A–Z' },
  { value: 'z-a', label: 'Z–A' },
];

function getSortableText(r) {
  const label = r.text?.trim() || (r.url ? (titleFromUrl(r.url) || r.url) : '');
  return label.toLowerCase();
}

export function RecommendationsView({
  recommendations,
  conversations,
  categories = [],
  onSelectConversation,
  onDeleteRecommendation,
}) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'highlight'
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const convById = (id) => conversations.find((c) => c.id === id);
  const hasUncategorized = recommendations.some((r) => !convById(r.conversationId)?.categoryId);
  const categoryIdsPresent = [...new Set(recommendations.map((r) => convById(r.conversationId)?.categoryId).filter(Boolean))];
  const filterOptions = [
    ...(hasUncategorized ? [{ value: '__none__', label: 'Uncategorized' }] : []),
    ...categories
      .filter((cat) => categoryIdsPresent.includes(cat.id))
      .map((cat) => ({ value: cat.id, label: cat.name }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
  ];

  const isValidCategory = categoryFilter === 'all' || filterOptions.some((o) => o.value === categoryFilter);
  const effectiveCategory = isValidCategory ? categoryFilter : 'all';

  const filteredAndSorted = useMemo(() => {
    const byId = (id) => conversations.find((c) => c.id === id);
    let list = recommendations;

    // Category filter
    if (effectiveCategory !== 'all') {
      list = list.filter((r) => {
        const catId = byId(r.conversationId)?.categoryId;
        return effectiveCategory === '__none__' ? !catId : catId === effectiveCategory;
      });
    }

    // Type filter: Highlighted text only
    if (typeFilter === 'highlight') {
      list = list.filter((r) => r.type === 'highlight');
    }

    // Keyword search (text and url, case-insensitive)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const inText = (r.text || '').toLowerCase().includes(q);
        const inUrl = (r.url || '').toLowerCase().includes(q);
        return inText || inUrl;
      });
    }

    // Sort (default: newest first)
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'newest' || sortBy === 'oldest') {
        const aDate = a.createdAt || '';
        const bDate = b.createdAt || '';
        const cmp = aDate.localeCompare(bDate);
        return sortBy === 'newest' ? -cmp : cmp;
      }
      const aText = getSortableText(a);
      const bText = getSortableText(b);
      const cmp = aText.localeCompare(bText, undefined, { sensitivity: 'base' });
      return sortBy === 'z-a' ? -cmp : cmp;
    });

    return sorted;
  }, [recommendations, effectiveCategory, typeFilter, searchQuery, sortBy, conversations]);

  const getConversationTitle = (id) => {
    if (!id) return '—';
    const c = convById(id);
    return c ? c.title : 'Unknown';
  };

  return (
    <article className="recommendations-view">
      <header>
        <h1>Recommendations</h1>
      </header>
      <p className="recommendations-hint">
        Names, books, movies, recipes, and links pulled from your conversations. Use the <strong>Recommendations</strong> button on a conversation to extract them.
      </p>
      <div className="recommendations-controls">
        <div className="filter-row">
          <label className="filter-group">
            <span className="filter-label">Category</span>
            <select
              value={effectiveCategory}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All</option>
              {filterOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-group">
            <span className="filter-label">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by type"
            >
              <option value="all">All</option>
              <option value="highlight">Highlighted text only</option>
            </select>
          </label>
          <label className="filter-group">
            <span className="filter-label">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort order"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="search-group">
          <span className="filter-label">Search</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keyword search…"
            aria-label="Search recommendations by keyword"
            className="recommendations-search"
          />
        </label>
      </div>
      <ul className="all-recommendations">
        {filteredAndSorted.length === 0 && (
          <li className="empty">
            {recommendations.length === 0 ? (
              <>No recommendations yet. Open a conversation and click <strong>Recommendations</strong> to extract names, books, movies, recipes, and links.</>
            ) : (
              'No recommendations match the current filters or search.'
            )}
          </li>
        )}
        {filteredAndSorted.map((r) => (
          <li key={r.id} className={`recommendation-row type-${r.type}`}>
            <span className="rec-type-badge">{TYPE_LABELS[r.type] || r.type}</span>
            <span className="rec-text">
              {r.url ? (
                <>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="content-link">
                    {getLinkDisplayText(r)}
                  </a>
                  <span className="rec-url-secondary" title={r.url}>{r.url}</span>
                </>
              ) : (
                r.text
              )}
            </span>
            <button
              type="button"
              className="rec-conversation-link"
              onClick={() => onSelectConversation(r.conversationId)}
              title="Open conversation"
            >
              {getConversationTitle(r.conversationId)}
            </button>
            <button
              type="button"
              className="btn-remove"
              onClick={() => onDeleteRecommendation(r.id)}
              aria-label="Remove from Recommendations"
              title="Remove from Recommendations"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
