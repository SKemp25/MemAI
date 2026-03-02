import { useState } from 'react';
import './AddConversation.css';

function getInitialTagInput(conversation, tags) {
  if (!conversation?.tagIds?.length || !tags?.length) return '';
  return conversation.tagIds
    .map((id) => tags.find((t) => t.id === id)?.name)
    .filter(Boolean)
    .join(', ');
}

export function AddConversation({
  categories,
  tags,
  conversation = null,
  onSave,
  onCancel,
  onAddCategory,
  onAddTag,
  getTagByName,
}) {
  const isEdit = Boolean(conversation);

  const [title, setTitle] = useState(conversation?.title ?? '');
  const [content, setContent] = useState(conversation?.content ?? '');
  const [categoryId, setCategoryId] = useState(conversation?.categoryId ?? '');
  const [tagInput, setTagInput] = useState(() => getInitialTagInput(conversation, tags));
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const effectiveCategoryId = categoryId || (categories[0]?.id ?? null);

  const handleAddNewCategory = () => {
    const name = newCategoryName.trim();
    if (!name || !onAddCategory) return;
    const newId = onAddCategory({ name });
    setCategoryId(newId);
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const parseTagIds = (input) => {
    if (!input.trim() || !onAddTag) return [];
    const names = input.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    const ids = [];
    for (const name of names) {
      const existing = getTagByName?.(name);
      const id = existing ? existing.id : onAddTag(name);
      if (id) ids.push(id);
    }
    return ids;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagIds = parseTagIds(tagInput);
    onSave({
      title: title.trim(),
      content: content.trim(),
      categoryId: effectiveCategoryId || null,
      tagIds,
    });
    if (!isEdit) {
      setTitle('');
      setContent('');
      setCategoryId('');
      setTagInput('');
    }
  };

  return (
    <article className="add-conversation">
      <header>
        <h1>{isEdit ? 'Edit conversation' : 'Save conversation or snippet'}</h1>
        <button type="button" className="btn-back" onClick={onCancel}>
          ← Cancel
        </button>
      </header>
      <p className="hint">
        {isEdit
          ? 'Update the title, category, tags, or content below.'
          : 'Paste content from ChatGPT or Gemini below. Give it a title, choose a category (e.g. People, Places), and add tags if you like. Everything is saved only on this device.'}
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            placeholder="e.g. Trip planning, Book recommendations"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label>
          Category
          <div className="category-row">
            <select
              value={categoryId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__new__') setShowNewCategory(true);
                else setCategoryId(val || '');
              }}
              aria-label="Category"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              <option value="__new__">+ Add new category</option>
            </select>
            {showNewCategory && (
              <span className="inline-new-category">
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())}
                  autoFocus
                />
                <button type="button" className="btn-small" onClick={handleAddNewCategory}>
                  Add
                </button>
                <button type="button" className="btn-small" onClick={() => setShowNewCategory(false)}>
                  Cancel
                </button>
              </span>
            )}
          </div>
        </label>

        <label>
          Tags <span className="label-optional">(optional)</span>
          <input
            type="text"
            placeholder="e.g. Mum, London, doctor (comma or space separated)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
        </label>

        <label>
          Conversation content
          <textarea
            placeholder="Paste your ChatGPT or Gemini conversation here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {isEdit ? 'Save changes' : 'Save'}
          </button>
        </div>
      </form>
    </article>
  );
}
