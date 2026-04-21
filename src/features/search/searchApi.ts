import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabase';
import { rowToJob, type JobRow } from '../../repositories/rowToJob';
import type { Job, JobStatus } from '../../types/job';

export interface SearchFilters {
  dept: string | null;
  machine: string | null;
  status: JobStatus | null;
  dateFrom: string | null; // ISO date (YYYY-MM-DD)
  dateTo: string | null;
}

export const EMPTY_FILTERS: SearchFilters = {
  dept: null,
  machine: null,
  status: null,
  dateFrom: null,
  dateTo: null,
};

export function filtersAreEmpty(f: SearchFilters): boolean {
  return !f.dept && !f.machine && !f.status && !f.dateFrom && !f.dateTo;
}

export function activeFilterCount(f: SearchFilters): number {
  let n = 0;
  if (f.dept) n++;
  if (f.machine) n++;
  if (f.status) n++;
  if (f.dateFrom || f.dateTo) n++;
  return n;
}

export interface SearchHit {
  job: Job;
  snippet: string | null;
  matchedField: string | null;
}

const SNIPPET_RADIUS = 60;

export function extractSnippet(
  query: string,
  job: Job,
): { snippet: string; field: string } | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const fields: Array<{ key: string; value: string }> = [
    { key: 'Description', value: job.desc },
    { key: 'Root cause', value: job.rootCause },
    { key: 'Corrective action', value: job.action },
    { key: 'Remarks', value: job.remarks },
    { key: 'Machine', value: job.machine },
    { key: 'Department', value: job.dept },
    { key: 'Inventory', value: job.inv },
  ];

  for (const { key, value } of fields) {
    if (!value) continue;
    const idx = value.toLowerCase().indexOf(q);
    if (idx === -1) continue;
    const start = Math.max(0, idx - SNIPPET_RADIUS);
    const end = Math.min(value.length, idx + q.length + SNIPPET_RADIUS);
    const prefix = start > 0 ? '…' : '';
    const suffix = end < value.length ? '…' : '';
    return {
      snippet: `${prefix}${value.slice(start, end)}${suffix}`,
      field: key,
    };
  }
  return null;
}

export async function searchJobs(
  query: string,
  filters: SearchFilters = EMPTY_FILTERS,
  client?: SupabaseClient,
): Promise<SearchHit[]> {
  const q = query.trim();
  const hasFilters = !filtersAreEmpty(filters);
  if (!q && !hasFilters) return [];

  const c = client ?? getSupabaseClient();
  const { data, error } = await c.rpc('search_jobs', {
    q,
    filter_dept: filters.dept,
    filter_machine: filters.machine,
    filter_status: filters.status,
    filter_date_from: filters.dateFrom,
    filter_date_to: filters.dateTo,
  });
  if (error) throw new Error(`search failed: ${error.message}`);
  const rows = (data ?? []) as JobRow[];
  return rows.map((row) => {
    const job = rowToJob(row);
    const hit = q ? extractSnippet(q, job) : null;
    return {
      job,
      snippet: hit?.snippet ?? null,
      matchedField: hit?.field ?? null,
    };
  });
}
