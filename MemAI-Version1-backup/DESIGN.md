# Design: How content is organized

This app is for people with early memory loss. Finding saved content easily is as important as saving it. The organization model supports **multiple ways to save and find** content.

## Ways to find content

1. **By date** – "What did I save last week?" Every saved item has a date. The list can be grouped or filtered by date.
2. **By category** – Broad buckets you define (e.g. People, Places, Health, Recipes, Travel). When you paste, you choose one category (or "Uncategorized"). Good for "which drawer did I put it in?"
3. **By tags** – Multiple labels per item (e.g. "Mum", "Dr. Smith", "London", "2024 trip"). One item can have several tags. Good for "everything about X" without choosing a single folder.
4. **Keyword search** – Search in title and content (and tags) so you can find by any word you remember.

## Categories vs tags

- **Categories**: One per saved item. User-defined list (People, Places, etc.). Choose when pasting or editing. Simple and clear.
- **Tags**: Multiple per item. Optional. Use for people’s names, place names, topics. You can add tags when saving or later. Combines well with categories (e.g. category "People", tags "Mum", "birthday").

So: **use both**. Categories for a primary bucket; tags for flexible, multi-label finding.

## Paste flow

1. User pastes (or types) content from ChatGPT or Gemini.
2. User gives a title (or we keep "Untitled").
3. User selects a **category** (existing or "Add new category").
4. User can add **tags** (optional).
5. Save. Content is stored locally with date, category, and tags.

## Local storage

All data stays on the device (localStorage). No server or account required.

## Color palettes

Users can choose a color palette (e.g. Calm, Warm, High contrast) for comfort and accessibility. Choice is saved locally.
