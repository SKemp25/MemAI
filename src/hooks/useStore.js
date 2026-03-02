import { useState, useEffect, useCallback } from 'react';
import { load, save, id } from '../data/store';

export function useStore() {
  const [data, setData] = useState(load);

  useEffect(() => {
    save(data);
  }, [data]);

  const addConversation = useCallback(({ title, content, categoryId = null, tagIds = [] }) => {
    const newId = id();
    setData((prev) => ({
      ...prev,
      conversations: [
        {
          id: newId,
          title: title.trim() || 'Untitled conversation',
          content: content.trim(),
          categoryId,
          tagIds: Array.isArray(tagIds) ? tagIds : [],
          summary: null,
          summarizedAt: null,
          createdAt: new Date().toISOString(),
        },
        ...prev.conversations,
      ],
    }));
    return newId;
  }, []);

  const updateConversation = useCallback((conversationId, updates) => {
    setData((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === conversationId ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const addCategory = useCallback(({ name, color = '#64748b' }) => {
    const newId = id();
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, { id: newId, name: name.trim(), color }],
    }));
    return newId;
  }, []);

  const updateCategory = useCallback((categoryId, updates) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ),
    }));
  }, []);

  const deleteCategory = useCallback((categoryId) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== categoryId),
      conversations: prev.conversations.map((c) =>
        c.categoryId === categoryId ? { ...c, categoryId: null } : c
      ),
    }));
  }, []);

  const addTag = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = data.tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    const newId = id();
    setData((prev) => ({
      ...prev,
      tags: [...prev.tags, { id: newId, name: trimmed }],
    }));
    return newId;
  }, [data.tags]);

  const getTagByName = useCallback(
    (name) => data.tags.find((t) => t.name.toLowerCase() === name.trim().toLowerCase()),
    [data.tags]
  );

  const deleteTag = useCallback((tagId) => {
    setData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.id !== tagId),
      conversations: prev.conversations.map((c) => ({
        ...c,
        tagIds: (c.tagIds || []).filter((id) => id !== tagId),
      })),
    }));
  }, []);

  const deleteConversation = useCallback((conversationId) => {
    setData((prev) => ({
      ...prev,
      conversations: prev.conversations.filter((c) => c.id !== conversationId),
      recommendations: (prev.recommendations || []).filter((r) => r.conversationId !== conversationId),
    }));
  }, []);

  const addRecommendation = useCallback(
    ({ conversationId, type, text, url = null }) => {
      setData((prev) => ({
        ...prev,
        recommendations: [
          ...(prev.recommendations || []),
          {
            id: id(),
            conversationId,
            type,
            text: (text || '').trim(),
            url: url?.trim() || null,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    []
  );

  const deleteRecommendation = useCallback((recommendationId) => {
    setData((prev) => ({
      ...prev,
      recommendations: (prev.recommendations || []).filter((r) => r.id !== recommendationId),
    }));
  }, []);

  const getRecommendationsForConversation = useCallback(
    (conversationId) => (data.recommendations || []).filter((r) => r.conversationId === conversationId),
    [data.recommendations]
  );

  const replaceData = useCallback((payload) => {
    setData((prev) => ({
      ...prev,
      conversations: payload.conversations ?? prev.conversations,
      recommendations: payload.recommendations ?? prev.recommendations,
      categories: payload.categories ?? prev.categories,
      tags: payload.tags ?? prev.tags,
    }));
  }, []);

  const categoriesSorted = [...(data.categories || [])].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  );

  return {
    conversations: data.conversations,
    recommendations: data.recommendations || [],
    categories: categoriesSorted,
    tags: data.tags,
    addConversation,
    updateConversation,
    deleteConversation,
    addRecommendation,
    deleteRecommendation,
    getRecommendationsForConversation,
    replaceData,
    addCategory,
    updateCategory,
    deleteCategory,
    addTag,
    getTagByName,
    deleteTag,
  };
}
