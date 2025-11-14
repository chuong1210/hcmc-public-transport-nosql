import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { BusRoute } from '@/types';

export function useRoutes(filters?: { status?: string; type?: string }) {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await api.getRoutes(filters);
      if (response.success) {
        setRoutes(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [filters?.status, filters?.type]);

  const refetch = () => {
    fetchRoutes();
  };

  return { routes, loading, error, refetch };
}