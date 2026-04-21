import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabase';

export interface Department {
  id: number;
  name: string;
  sort_order: number;
}

export interface Machine {
  id: number;
  department_id: number;
  name: string;
  sort_order: number;
}

export async function fetchDepartments(client?: SupabaseClient): Promise<Department[]> {
  const c = client ?? getSupabaseClient();
  const { data, error } = await c
    .from('departments')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw new Error(`departments fetch: ${error.message}`);
  return (data ?? []) as Department[];
}

export async function fetchMachines(client?: SupabaseClient): Promise<Machine[]> {
  const c = client ?? getSupabaseClient();
  const { data, error } = await c
    .from('machines')
    .select('id, department_id, name, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw new Error(`machines fetch: ${error.message}`);
  return (data ?? []) as Machine[];
}
