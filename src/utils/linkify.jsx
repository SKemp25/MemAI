import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;

/**
 * Trim trailing punctuation that's likely not part of the URL.
 */
function trimUrlPunctuation(url) {
  return url.replace(/[.,;:!?)\]]+$/, '');
}

/**
 * Split text into segments and turn URLs into <a> elements.
 * Use in a container that preserves whitespace (e.g. <pre>) or inline.
 */
export function linkifyContent(text) {
  if (!text || typeof text !== 'string') return null;
  const segments = text.split(URL_REGEX);
  return segments.map((segment, i) => {
    const isUrl = segment.startsWith('http://') || segment.startsWith('https://');
    if (isUrl) {
      const href = trimUrlPunctuation(segment);
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="content-link"
        >
          {segment}
        </a>
      );
    }
    return segment;
  });
}
