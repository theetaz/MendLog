import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = '@mendlog/recent-searches-v1';
const MAX = 8;

interface Return {
  recents: string[];
  push(query: string): Promise<void>;
  clear(): Promise<void>;
}

export function useRecentSearches(): Return {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) setRecents(list.filter((x) => typeof x === 'string'));
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, []);

  const push = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setRecents((prev) => {
      const next = [q, ...prev.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clear = useCallback(async () => {
    setRecents([]);
    await AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  return { recents, push, clear };
}
