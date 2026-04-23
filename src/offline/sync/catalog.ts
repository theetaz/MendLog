import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../db';
import { departments, machines } from '../schema';
import { setMetaNumber } from './meta';
import { now } from './time';

// Catalog is read-only reference data — full truncate-and-replace is simpler
// and safer than row-level diffing. Fetched quantities are small (dozens of
// departments, hundreds of machines), so cost is negligible.
export async function pullCatalog(client: SupabaseClient): Promise<{
  departments: number;
  machines: number;
}> {
  const [deptRes, machRes] = await Promise.all([
    client
      .from('departments')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true }),
    client
      .from('machines')
      .select('id, department_id, name, sort_order')
      .order('sort_order', { ascending: true }),
  ]);
  if (deptRes.error) throw new Error(`catalog departments: ${deptRes.error.message}`);
  if (machRes.error) throw new Error(`catalog machines: ${machRes.error.message}`);

  const deptRows = (deptRes.data ?? []) as {
    id: number;
    name: string;
    sort_order: number;
  }[];
  const machRows = (machRes.data ?? []) as {
    id: number;
    department_id: number;
    name: string;
    sort_order: number;
  }[];

  // Replace atomically so a partial failure doesn't leave the table empty.
  await db.transaction(async (tx) => {
    await tx.delete(machines);
    await tx.delete(departments);
    if (deptRows.length > 0) await tx.insert(departments).values(deptRows);
    if (machRows.length > 0) await tx.insert(machines).values(machRows);
  });

  await setMetaNumber('catalog.last_pulled_at', now());

  return { departments: deptRows.length, machines: machRows.length };
}
