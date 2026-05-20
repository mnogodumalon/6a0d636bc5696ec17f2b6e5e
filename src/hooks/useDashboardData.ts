import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FeierDerZahl1 } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [feierDerZahl1, setFeierDerZahl1] = useState<FeierDerZahl1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [feierDerZahl1Data] = await Promise.all([
        LivingAppsService.getFeierDerZahl1(),
      ]);
      setFeierDerZahl1(feierDerZahl1Data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [feierDerZahl1Data] = await Promise.all([
          LivingAppsService.getFeierDerZahl1(),
        ]);
        setFeierDerZahl1(feierDerZahl1Data);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  return { feierDerZahl1, setFeierDerZahl1, loading, error, fetchAll };
}