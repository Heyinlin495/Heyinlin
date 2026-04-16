// Generic data fetching hook
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface UseFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useFetch<T>(endpoint: string, deps: unknown[] = []) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await api.get<T>(endpoint);
      if (res.success) {
        setState({ data: res.data as T, isLoading: false, error: null });
      } else {
        setState({ data: null, isLoading: false, error: res.error || 'Request failed' });
      }
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Network error',
      });
    }
  }, [endpoint, ...deps]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

// Hook for paginated lists
export function usePaginated<T>(
  endpoint: string,
  limit: number = 10,
  deps: unknown[] = []
) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<T[]>(
        `${endpoint}?page=${p}&limit=${limit}`
      );
      if (res.success && res.data) {
        if (p === 1) {
          setItems(res.data);
        } else {
          setItems(prev => [...prev, ...res.data!]);
        }
        setTotalPages(res.meta?.totalPages || 1);
        setHasMore(p < (res.meta?.totalPages || 1));
        setPage(p);
      } else {
        setError(res.error || 'Failed to load');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, limit, ...deps]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      loadPage(page + 1);
    }
  };

  return {
    items,
    isLoading,
    error,
    page,
    totalPages,
    hasMore,
    loadMore,
    refresh: () => loadPage(1),
  };
}
