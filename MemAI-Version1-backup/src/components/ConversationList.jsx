import { useState, useMemo } from 'react';
import './ConversationList.css';

function filterConversations(conversations, { search, categoryId, tagId }) {
  let list = conversations;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.content && c.content.toLowerCase().includes(q))
    );
  }
  if (categoryId) list = list.filter((c) => c.categoryId === categoryId);
  if (tagId) list = list.filter((c) => (c.tagIds || []).includes(tagId));
  return list;
}

function groupByDate(conversations) {
  const groups = { today: [], thisWeek: [], thisMonth: [], older: [] };
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(todayStart);
  monthAgo.setDate(monthAgo.getDate() - 30);

  for (const c of conversations) {
    const d = new Date(c.createdAt);
    if (d >= todayStart) groups.today.push(c);
    else if (d >= weekAgo) groups.thisWeek.push(c);
    else if (d >= monthAgo) groups.thisMonth.push(c);
    else groups.older.push(c);
  }
  return groups;
}

export function ConversationList({
  conversations,
  categories = [],
  tags = [],
  onSelect,
  onAdd,
  selectedId,
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [groupByDateOption, setGroupByDateOption] = useState(true);

  const filtered = useMemo(
    () =>
      filterConversations(conversations, {
        search,
        categoryId: categoryFilter || null,
        tagId: tagFilter || null,
      }),
    [conversations, search, categoryFilter, tagFilter]
  );

  const grouped = useMemo(() => {
    if (!groupByDateOption) return { single: filtered };
    return groupByDate(filtered);
  }, [filtered, groupByDateOption]);

  const hasGroups =
    groupByDateOption &&
    (grouped.today?.length > 0 ||
      grouped.thisWeek?.length > 0 ||
      grouped.thisMonth?.length > 0 ||
      grouped.older?.length > 0);

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name ?? '';

  const renderItem = (c) => (
    <li key={c.id}>
      <button
        type="button"
        className={`conversation-item ${selectedId === c.id ? 'selected' : ''}`}
        onClick={() => onSelect(c.id)}
      >
        <span className="conversation-title">{c.title}</span>
        <span className="conversation-meta-row">
          {c.categoryId && (
            <span className="conversation-category" title={getCategoryName(c.categoryId)}>
              {getCategoryName(c.categoryId)}
            </span>
          )}
          <span className="conversation-date">
            {new Date(c.createdAt).toLocaleDateString()}
          </span>
        </span>
      </button>
    </li>
  );

  return (
    <section className="conversation-list">
      <header>
        <h2>Saved</h2>
        <button type="button" className="btn-primary" onClick={onAdd}>
          + New
        </button>
      </header>

      <div className="list-filters">
        <input
          type="search"
          placeholder="Search title or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          aria-label="Search"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="filter-select"
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <label className="group-by-date-label">
          <input
            type="checkbox"
            checked={groupByDateOption}
            onChange={(e) => setGroupByDateOption(e.target.checked)}
          />
          <span>Group by date</span>
        </label>
      </div>

      <ul className="conversation-ul">
        {filtered.length === 0 && (
          <li className="empty">
            {conversations.length === 0
              ? 'No conversations yet. Add one to get started.'
              : 'No matches. Try different search or filters.'}
          </li>
        )}

        {!hasGroups &&
          filtered.map((c) => renderItem(c))}

        {hasGroups && (
          <>
            {grouped.today.length > 0 && (
              <li className="group-header">Today</li>
            )}
            {grouped.today.map((c) => renderItem(c))}
            {grouped.thisWeek.length > 0 && (
              <li className="group-header">This week</li>
            )}
            {grouped.thisWeek.map((c) => renderItem(c))}
            {grouped.thisMonth.length > 0 && (
              <li className="group-header">This month</li>
            )}
            {grouped.thisMonth.map((c) => renderItem(c))}
            {grouped.older.length > 0 && (
              <li className="group-header">Older</li>
            )}
            {grouped.older.map((c) => renderItem(c))}
          </>
        )}
      </ul>
    </section>
  );
}
