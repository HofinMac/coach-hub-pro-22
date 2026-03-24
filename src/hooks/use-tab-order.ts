import { useState, useEffect, useCallback } from "react";

interface TabItem {
  to: string;
  label: string;
}

const STORAGE_KEY_PREFIX = "tab-order-";

export function useTabOrder(
  key: string,
  allItems: TabItem[],
  defaultMainCount = 4
) {
  const storageKey = STORAGE_KEY_PREFIX + key;

  const [mainTabs, setMainTabs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        // Validate that saved items still exist
        const valid = parsed.filter(to => allItems.some(i => i.to === to));
        if (valid.length >= 2) return valid;
      }
    } catch {}
    return allItems.slice(0, defaultMainCount).map(i => i.to);
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(mainTabs));
  }, [mainTabs, storageKey]);

  const mainItems = mainTabs
    .map(to => allItems.find(i => i.to === to))
    .filter(Boolean) as TabItem[];

  const overflowItems = allItems.filter(i => !mainTabs.includes(i.to));

  const moveUp = useCallback((to: string) => {
    setMainTabs(prev => {
      const idx = prev.indexOf(to);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((to: string) => {
    setMainTabs(prev => {
      const idx = prev.indexOf(to);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const addToMain = useCallback((to: string) => {
    setMainTabs(prev => {
      if (prev.includes(to)) return prev;
      if (prev.length >= 4) return prev; // max 4
      return [...prev, to];
    });
  }, []);

  const removeFromMain = useCallback((to: string) => {
    setMainTabs(prev => {
      if (prev.length <= 2) return prev; // min 2
      return prev.filter(t => t !== to);
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setMainTabs(allItems.slice(0, defaultMainCount).map(i => i.to));
  }, [allItems, defaultMainCount]);

  return {
    mainItems,
    overflowItems,
    mainTabs,
    moveUp,
    moveDown,
    addToMain,
    removeFromMain,
    resetToDefault,
  };
}
