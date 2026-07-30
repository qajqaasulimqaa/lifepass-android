import { useEffect, useState } from 'react';
import { fetchPlanCatalog, type PlanCatalog } from '../services/catalog';

/**
 * Fetches the live priced plan catalogue once on mount. Mirrors iOS
 * `catalog = try? await fetchPlanCatalog()` — a failure resolves to `null`
 * (the caller renders plan cards without prices rather than blocking).
 */
export function usePlanCatalog(): PlanCatalog | null {
  const [catalog, setCatalog] = useState<PlanCatalog | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPlanCatalog()
      .then((c) => { if (alive) setCatalog(c); })
      .catch(() => { /* no prices available — cards still render */ });
    return () => { alive = false; };
  }, []);

  return catalog;
}
