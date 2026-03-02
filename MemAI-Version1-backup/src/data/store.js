const STORAGE_KEY = 'chatgpt-convo-tracker';
const THEME_KEY = 'chatgpt-convo-tracker-theme';
const CUSTOM_ACCENT_KEY = 'chatgpt-convo-tracker-custom-accent';

const DEFAULT_CATEGORIES = [
  { id: 'cat-people', name: 'People', color: '#0ea5e9' },
  { id: 'cat-places', name: 'Places', color: '#22c55e' },
  { id: 'cat-health', name: 'Health', color: '#a855f7' },
  { id: 'cat-other', name: 'Other', color: '#64748b' },
];

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        conversations: [],
        recommendations: [],
        categories: [...DEFAULT_CATEGORIES],
        tags: [],
      };
    }
    const data = JSON.parse(raw);
    const conversations = (data.conversations ?? []).map((c) => ({
      ...c,
      categoryId: c.categoryId ?? null,
      tagIds: Array.isArray(c.tagIds) ? c.tagIds : [],
      summary: c.summary ?? null,
      summarizedAt: c.summarizedAt ?? null,
      summarySource: c.summarySource ?? null,
    }));
    const recommendations = (data.recommendations ?? []).map((r) => ({
      ...r,
      type: r.type ?? 'link',
      url: r.url ?? null,
    }));
    return {
      conversations,
      recommendations,
      categories: data.categories?.length ? data.categories : [...DEFAULT_CATEGORIES],
      tags: data.tags ?? [],
    };
  } catch {
    return {
      conversations: [],
      recommendations: [],
      categories: [...DEFAULT_CATEGORIES],
      tags: [],
    };
  }
}

export function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'default';
}

export function saveTheme(themeId) {
  localStorage.setItem(THEME_KEY, themeId);
}

export function loadCustomAccent() {
  return localStorage.getItem(CUSTOM_ACCENT_KEY) || '#0d9488';
}

export function saveCustomAccent(hex) {
  localStorage.setItem(CUSTOM_ACCENT_KEY, hex || '#0d9488');
}

export function id() {
  return crypto.randomUUID();
}
