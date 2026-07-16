import { useCallback, useEffect, useState } from 'react';
import { fetchCompanyPlanContext, type CompanyPlanContext } from '../services/companyPlans';

type CompanyPlanState = {
  context: CompanyPlanContext | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useCompanyPlan(): CompanyPlanState {
  const [context, setContext] = useState<CompanyPlanContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCompanyPlanContext()
      .then(setContext)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { context, loading, error, refetch: load };
}
