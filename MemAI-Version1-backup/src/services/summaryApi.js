const API_KEY_KEY = 'chatgpt-convo-tracker-openai-api-key';

const MAX_PREVIEW_LENGTH = 320;

export function getApiKey() {
  return localStorage.getItem(API_KEY_KEY) || '';
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_KEY, key || '');
}

/**
 * Build a short preview from the start of the text (no API, no account).
 * Uses first ~320 characters, trimmed to a sentence or word boundary.
 * @param {string} content - Full conversation text
 * @returns {{ summary: string, source: 'local' }}
 */
export function getLocalSummary(content) {
  const text = (content || '').trim();
  if (!text) return { summary: '', source: 'local' };

  if (text.length <= MAX_PREVIEW_LENGTH) {
    return { summary: text, source: 'local' };
  }

  let cut = text.slice(0, MAX_PREVIEW_LENGTH);
  const lastSentence = Math.max(
    cut.lastIndexOf('. '),
    cut.lastIndexOf('! '),
    cut.lastIndexOf('? '),
    cut.lastIndexOf('.\n'),
    cut.lastIndexOf('!\n'),
    cut.lastIndexOf('?\n')
  );
  if (lastSentence > MAX_PREVIEW_LENGTH / 2) {
    cut = cut.slice(0, lastSentence + 1).trim();
  } else {
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > MAX_PREVIEW_LENGTH / 2) cut = cut.slice(0, lastSpace);
    cut = cut.trim();
    if (cut.length && !/[.!?]$/.test(cut)) cut += '…';
  }
  return { summary: cut, source: 'local' };
}

const SYSTEM_PROMPT = `You are a helpful assistant that writes short, clear summaries of saved chat conversations.
Summarize the conversation in 2–4 sentences. Focus on the main topic, any decisions or recommendations, and key facts. Use plain language. Do not use bullet points unless the content is a list.`;

/**
 * Call OpenAI API to summarize the given text. Returns the summary string or throws.
 * @param {string} content - Conversation text to summarize
 * @returns {Promise<string>}
 */
export async function summarizeWithAI(content) {
  const apiKey = getApiKey();
  if (!apiKey?.trim()) {
    throw new Error('No API key set. Add your OpenAI API key in the Summary section.');
  }

  const text = (content || '').trim();
  if (!text) {
    throw new Error('No content to summarize.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text.slice(0, 12000) },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const rawMessage = err.error?.message || response.statusText || `Request failed (${response.status})`;
    const lower = rawMessage.toLowerCase();
    if (lower.includes('quota') || lower.includes('billing') || response.status === 429) {
      throw new Error(
        'Your OpenAI account has hit its usage or billing limit. Check your plan and billing at platform.openai.com, then try again.'
      );
    }
    throw new Error(rawMessage);
  }

  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    throw new Error('No summary returned from API.');
  }
  return summary;
}
