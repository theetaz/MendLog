import { useEffect, useState } from 'react';
import { type Department, type Machine, fetchDepartments, fetchMachines } from './catalogApi';

export interface CatalogState {
  loading: boolean;
  error: string | null;
  departments: Department[];
  machines: Machine[];
  machinesByDept: Map<number, Machine[]>;
}

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    loading: true,
    error: null,
    departments: [],
    machines: [],
    machinesByDept: new Map(),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [departments, machines] = await Promise.all([
          fetchDepartments(),
          fetchMachines(),
        ]);
        if (cancelled) return;
        const machinesByDept = new Map<number, Machine[]>();
        for (const m of machines) {
          const list = machinesByDept.get(m.department_id);
          if (list) list.push(m);
          else machinesByDept.set(m.department_id, [m]);
        }
        setState({ loading: false, error: null, departments, machines, machinesByDept });
      } catch (e) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: e instanceof Error ? e.message : 'Catalog load failed',
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
