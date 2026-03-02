import { useState, useEffect, useCallback } from 'react';
import { useStore } from './hooks/useStore';
import { loadTheme, saveTheme, loadCustomAccent, saveCustomAccent } from './data/store';
import { hasPin } from './data/pinLock';
import { summarizeWithAI, getLocalSummary, getApiKey } from './services/summaryApi';
import { extractRecommendations } from './services/recommendationsApi';
import { ConversationList } from './components/ConversationList';
import { ConversationDetail } from './components/ConversationDetail';
import { AddConversation } from './components/AddConversation';
import { SummaryView } from './components/SummaryView';
import { RecommendationsView } from './components/RecommendationsView';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { UsageGuide } from './components/UsageGuide';
import { LockScreen } from './components/LockScreen';
import { SecurityAndBackup } from './components/SecurityAndBackup';
import './App.css';

function accentToSubtle(hex) {
  const m = hex.slice(1).match(/.{2}/g);
  if (!m) return '#ccfbf1';
  const r = Math.round(parseInt(m[0], 16) * 0.2 + 255 * 0.8);
  const g = Math.round(parseInt(m[1], 16) * 0.2 + 255 * 0.8);
  const b = Math.round(parseInt(m[2], 16) * 0.2 + 255 * 0.8);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  const {
    conversations,
    recommendations,
    categories,
    tags,
    addConversation,
    updateConversation,
    deleteConversation,
    addRecommendation,
    deleteRecommendation,
    getRecommendationsForConversation,
    replaceData,
    addCategory,
    addTag,
    getTagByName,
  } = useStore();

  const [unlocked, setUnlocked] = useState(() => !hasPin());

  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('conversations'); // 'conversations' | 'summary' | 'recommendations'
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [theme, setTheme] = useState(() => loadTheme());
  const [customAccent, setCustomAccent] = useState(() => loadCustomAccent());
  const [summarizingId, setSummarizingId] = useState(null);
  const [summarizeError, setSummarizeError] = useState(null);
  const [extractingRecommendationsId, setExtractingRecommendationsId] = useState(null);
  const [recommendationsError, setRecommendationsError] = useState(null);

  useEffect(() => {
    const t = theme || 'default';
    document.documentElement.dataset.theme = t;
    saveTheme(t);
    if (t === 'custom') {
      const accent = customAccent || loadCustomAccent();
      const subtle = accentToSubtle(accent);
      document.documentElement.style.setProperty('--accent', accent);
      document.documentElement.style.setProperty('--accent-subtle', subtle);
    } else {
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-subtle');
    }
  }, [theme, customAccent]);

  const selected = conversations.find((c) => c.id === selectedId);

  const handleSummarize = useCallback(
    async (conversationId) => {
      setSummarizeError(null);
      setSummarizingId(conversationId);
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv?.content?.trim()) {
        setSummarizeError('No content to summarize.');
        setSummarizingId(null);
        return;
      }
      try {
        if (getApiKey()?.trim()) {
          const summary = await summarizeWithAI(conv.content);
          updateConversation(conversationId, {
            summary,
            summarizedAt: new Date().toISOString(),
            summarySource: 'ai',
          });
        } else {
          const { summary, source } = getLocalSummary(conv.content);
          updateConversation(conversationId, {
            summary,
            summarizedAt: new Date().toISOString(),
            summarySource: source,
          });
        }
      } catch (err) {
        const { summary, source } = getLocalSummary(conv.content);
        updateConversation(conversationId, {
          summary,
          summarizedAt: new Date().toISOString(),
          summarySource: source,
        });
        setSummarizeError(err?.message || 'AI failed; saved a quick preview instead.');
      } finally {
        setSummarizingId(null);
      }
    },
    [conversations, updateConversation]
  );

  const handleExtractRecommendations = useCallback(
    async (conversationId) => {
      setRecommendationsError(null);
      setExtractingRecommendationsId(conversationId);
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv?.content?.trim()) {
        setRecommendationsError('No content to extract from.');
        setExtractingRecommendationsId(null);
        return;
      }
      try {
        const items = await extractRecommendations(conv.content, { apiKey: getApiKey() });
        if (items.length === 0) {
          setRecommendationsError(
            'No recommendations found. Add an OpenAI API key in the Summary tab to extract names, books, movies and recipes; otherwise only links in the text are extracted.'
          );
        } else {
          items.forEach((item) =>
            addRecommendation({
              conversationId,
              type: item.type,
              text: item.text,
              url: item.url ?? null,
            })
          );
        }
      } catch (err) {
        setRecommendationsError(err?.message || 'Extraction failed.');
      } finally {
        setExtractingRecommendationsId(null);
      }
    },
    [conversations, addRecommendation]
  );

  const handleSelect = (id) => {
    setSelectedId(id);
    setShowAdd(false);
    setEditingId(null);
  };

  const handleAddConversation = (payload) => {
    const newId = addConversation(payload);
    setShowAdd(false);
    if (newId) setSelectedId(newId);
  };

  const handleEditConversation = (payload) => {
    if (!editingId) return;
    updateConversation(editingId, payload);
    setEditingId(null);
  };

  if (!unlocked) {
    return (
      <LockScreen onUnlock={() => setUnlocked(true)} />
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <nav className="main-nav">
          <button
            type="button"
            className={view === 'conversations' ? 'active' : ''}
            onClick={() => {
              setView('conversations');
              setShowAdd(false);
            }}
          >
            Conversations
          </button>
          <button
            type="button"
            className={view === 'recommendations' ? 'active' : ''}
            onClick={() => setView('recommendations')}
          >
            Recommendations
          </button>
          <button
            type="button"
            className={view === 'summary' ? 'active' : ''}
            onClick={() => setView('summary')}
          >
            Summary
          </button>
        </nav>
        {view === 'conversations' && (
          <ConversationList
            conversations={conversations}
            categories={categories}
            tags={tags}
            selectedId={selectedId}
            onSelect={handleSelect}
            onAdd={() => setShowAdd(true)}
          />
        )}
        <UsageGuide />
        {view === 'conversations' && (
          <ThemeSwitcher
            theme={theme || 'default'}
            onThemeChange={setTheme}
            customAccent={customAccent}
            onCustomAccentChange={(hex) => {
              setCustomAccent(hex);
              saveCustomAccent(hex);
            }}
          />
        )}
        <SecurityAndBackup
          conversations={conversations}
          recommendations={recommendations}
          categories={categories}
          tags={tags}
          theme={theme}
          customAccent={customAccent}
          replaceData={replaceData}
          setTheme={setTheme}
          setCustomAccent={setCustomAccent}
          onLock={() => setUnlocked(false)}
        />
      </aside>
      <main className="main">
        {view === 'recommendations' && (
          <RecommendationsView
            recommendations={recommendations}
            conversations={conversations}
            categories={categories}
            onSelectConversation={(id) => {
              setView('conversations');
              setSelectedId(id);
            }}
            onDeleteRecommendation={deleteRecommendation}
          />
        )}
        {view === 'summary' && (
          <SummaryView
            conversations={conversations}
            onSelectConversation={(id) => {
              setView('conversations');
              setSelectedId(id);
            }}
            onSummarize={handleSummarize}
            summarizingId={summarizingId}
            summarizeError={summarizeError}
            clearSummarizeError={() => setSummarizeError(null)}
          />
        )}
        {view === 'conversations' && editingId && (
          <AddConversation
            key={editingId}
            conversation={conversations.find((c) => c.id === editingId)}
            categories={categories}
            tags={tags}
            onSave={handleEditConversation}
            onCancel={() => setEditingId(null)}
            onAddCategory={addCategory}
            onAddTag={addTag}
            getTagByName={getTagByName}
          />
        )}
        {view === 'conversations' && showAdd && !editingId && (
          <AddConversation
            key="new"
            categories={categories}
            onSave={handleAddConversation}
            onCancel={() => setShowAdd(false)}
            onAddCategory={addCategory}
            onAddTag={addTag}
            getTagByName={getTagByName}
          />
        )}
        {view === 'conversations' && !showAdd && !editingId && selected && (
          <ConversationDetail
            conversation={selected}
            categories={categories}
            tags={tags}
            recommendations={getRecommendationsForConversation(selected.id)}
            onBack={() => setSelectedId(null)}
            onEdit={() => setEditingId(selected.id)}
            onDelete={deleteConversation}
            onSummarize={() => handleSummarize(selected.id)}
            onExtractRecommendations={() => handleExtractRecommendations(selected.id)}
            onAddHighlightRecommendation={(text) => addRecommendation({ conversationId: selected.id, type: 'highlight', text, url: null })}
            onDeleteRecommendation={deleteRecommendation}
            summarizing={summarizingId === selected.id}
            summarizeError={summarizingId === selected.id ? summarizeError : null}
            extractingRecommendations={extractingRecommendationsId === selected.id}
            recommendationsError={extractingRecommendationsId === selected.id ? recommendationsError : null}
          />
        )}
        {view === 'conversations' && !showAdd && !selected && (
          <div className="welcome">
            <h1>MemAI</h1>
            <div className="welcome-block">
              <p>Recall all that's important to you.</p>
              <p>Save chats from AI and content from life.</p>
            </div>
            <div className="welcome-block">
              <p>Tap <strong>+ New</strong> to paste and save.</p>
              <p>Everything stays on this device.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
