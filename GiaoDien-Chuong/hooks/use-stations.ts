import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Station } from '@/types';

export function useStations(filters?: { status?: string; type?: string }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await api.getStations(filters);
      if (response.success) {
        setStations(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, [filters?.status, filters?.type]);

  const refetch = () => {
    fetchStations();
  };

  return { stations, loading, error, refetch };
}