const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

/**
 * Trim trailing punctuation that's likely not part of the URL.
 */
function trimUrlPunctuation(url) {
  return url.replace(/[.,;:!?)\]]+$/, '');
}

const MAX_TITLE_LENGTH = 80;

/**
 * Derive a readable title from a URL when no link text was found. Used so every recommendation has a text title.
 * @param {string} url
 * @returns {string}
 */
export function titleFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const u = new URL(url);
    const host = (u.hostname || '').replace(/^www\./, '');
    const path = (u.pathname || '/')
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean)[0];
    if (!path) return host;
    let slug = path;
    try {
      slug = decodeURIComponent(path).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    } catch {
      slug = path.replace(/-/g, ' ');
    }
    const title = slug.length > 10 ? `${host} – ${slug}` : (slug || host);
    return title.length > MAX_TITLE_LENGTH ? title.slice(0, MAX_TITLE_LENGTH - 1) + '…' : title;
  } catch {
    try {
      const u = new URL(url);
      return (u.hostname || '').replace(/^www\./, '') || 'Link';
    } catch {
      return url.length > MAX_TITLE_LENGTH ? url.slice(0, MAX_TITLE_LENGTH - 1) + '…' : url;
    }
  }
}

/**
 * Display text for a link recommendation: prefer stored text, else title from URL, never raw long URL.
 */
export function getLinkDisplayText(r) {
  const url = r?.url || '';
  const text = (r?.text || '').trim();
  const looksLikeUrl = /^https?:\/\//i.test(text) || text.length > 80;
  if (text && text !== url && !looksLikeUrl) return text;
  const fromUrl = titleFromUrl(url);
  if (fromUrl) return fromUrl;
  if (url.length <= 60) return url;
  try {
    const u = new URL(url);
    return (u.hostname || '').replace(/^www\./, '') || 'Open link';
  } catch {
    return 'Open link';
  }
}

/**
 * Infer recommendation type from link text and URL (no API). Used so filters like "Book" show relevant items.
 * @param {string} text - Label or description
 * @param {string} url - Full URL
 * @returns {'book'|'movie'|'recipe'|'link'}
 */
function inferRecommendationType(text, url) {
  const combined = `${(text || '')} ${(url || '')}`.toLowerCase();
  if (/\b(book|goodreads|kindle|audible|barnesandnoble|bookshop|amazon\.com.*book|ebook|novel|reading)\b/.test(combined)) return 'book';
  if (/\b(movie|film|imdb|netflix|rottentomatoes|trailer|cinema|streaming)\b/.test(combined)) return 'movie';
  if (/\b(recipe|food|cooking|allrecipes|foodnetwork|epicurious|bonappetit|ingredient)\b/.test(combined)) return 'recipe';
  return 'link';
}

/**
 * Extract link text from the same line before the URL (e.g. "**Title** - https://..." or "Title: https://...").
 */
function getPrecedingLinkText(content, urlStartIndex) {
  const lineStart = content.lastIndexOf('\n', urlStartIndex - 1) + 1;
  const beforeUrl = content.slice(lineStart, urlStartIndex).trim();
  if (!beforeUrl) return null;
  const trimmed = beforeUrl
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim();
  const sep = trimmed.search(/\s*[-–—:]\s*$/);
  const label = (sep >= 0 ? trimmed.slice(0, sep) : trimmed).trim();
  if (label.length > 2 && label.length < 120) return label;
  return null;
}

/**
 * Extract URLs from text (no API), with link text when available. Returns items with type 'link', text and url.
 * @param {string} content
 * @returns {{ type: 'link', text: string, url: string }[]}
 */
export function extractLinksLocal(content) {
  const text = (content || '').trim();
  if (!text) return [];
  const seen = new Set();
  const items = [];

  // 1) Markdown links [label](url)
  let m;
  MARKDOWN_LINK_REGEX.lastIndex = 0;
  while ((m = MARKDOWN_LINK_REGEX.exec(text)) !== null) {
    const label = (m[1] || '').trim();
    let url = trimUrlPunctuation((m[2] || '').trim());
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const linkText = label || titleFromUrl(url);
    items.push({ type: inferRecommendationType(linkText, url), text: linkText, url });
  }

  // 2) Bare URLs, with optional preceding line text as label
  URL_REGEX.lastIndex = 0;
  while ((m = URL_REGEX.exec(text)) !== null) {
    let url = trimUrlPunctuation(m[0]);
    if (seen.has(url)) continue;
    seen.add(url);
    const label = getPrecedingLinkText(text, m.index) || titleFromUrl(url);
    items.push({ type: inferRecommendationType(label, url), text: label, url });
  }

  return items;
}

const RECO_PROMPT = `Extract recommendations from the following conversation. Reply with ONLY a valid JSON object (no markdown, no code fence) with exactly these keys:
- "names": array of person or place names that were recommended or mentioned as important (e.g. doctor names, contacts).
- "books": array of book titles recommended or mentioned.
- "movies": array of film/movie titles recommended or mentioned.
- "recipes": array of food or recipe names recommended or mentioned.
- "links": array of objects with "text" (short label) and "url" (full URL) for any recommended or important links.

Omit any key if there are none. Use empty arrays [] for missing keys. Be concise; only include clear recommendations.`;

/**
 * Call OpenAI to extract names, books, movies, recipes, and links. Returns flat array of { type, text, url? }.
 * @param {string} content
 * @param {string} apiKey
 * @returns {Promise<{ type: string, text: string, url?: string }[]>}
 */
export async function extractRecommendationsWithAI(content, apiKey) {
  const text = (content || '').trim().slice(0, 12000);
  if (!text || !apiKey?.trim()) return [];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: RECO_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: 800,
      temperature: 0.2,
    }),
  });

  if (!response.ok) return [];

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return [];

  try {
    const json = JSON.parse(raw.replace(/^```\w*\n?|\n?```$/g, '').trim());
    const items = [];
    (json.names || []).forEach((t) => items.push({ type: 'name', text: String(t).trim(), url: null }));
    (json.books || []).forEach((t) => items.push({ type: 'book', text: String(t).trim(), url: null }));
    (json.movies || []).forEach((t) => items.push({ type: 'movie', text: String(t).trim(), url: null }));
    (json.recipes || []).forEach((t) => items.push({ type: 'recipe', text: String(t).trim(), url: null }));
    (json.links || []).forEach((l) => {
      const url = l?.url ? String(l.url).trim() : null;
      const linkText = (l?.text ? String(l.text).trim() : null) || (url ? titleFromUrl(url) : null) || url;
      if (url) items.push({ type: inferRecommendationType(linkText, url), text: linkText || url, url });
    });
    return items.filter((i) => i.text);
  } catch {
    return [];
  }
}

/**
 * Extract recommendations: use AI if apiKey provided, else only local links. Always merge with local links to avoid duplicates.
 * @param {string} content
 * @param {{ apiKey?: string }} options
 * @returns {Promise<{ type: string, text: string, url?: string }[]>}
 */
export async function extractRecommendations(content, options = {}) {
  const localLinks = extractLinksLocal(content);
  const hasKey = options.apiKey?.trim();
  if (!hasKey) return localLinks;

  try {
    const aiItems = await extractRecommendationsWithAI(content, options.apiKey);
    const linkUrls = new Set(localLinks.map((l) => l.url));
    aiItems.forEach((item) => {
      if (item.type === 'link' && item.url && !linkUrls.has(item.url)) {
        linkUrls.add(item.url);
        localLinks.push(item);
      } else if (item.type !== 'link') {
        localLinks.push(item);
      }
    });
    return localLinks;
  } catch {
    return localLinks;
  }
}
