import { asc } from 'drizzle-orm';
import { db } from '../../offline/db';
import { departments as deptTable, machines as machTable } from '../../offline/schema';

// Reference data is sourced from the **local** SQLite mirror — populated by
// the catalog sync in src/offline/sync/catalog.ts. That way the form works
// offline. If the mirror is empty (first boot, pre-sync), callers get empty
// arrays; the Me screen's sync section is the escape hatch to fetch them.

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

export async function fetchDepartments(): Promise<Department[]> {
  const rows = await db
    .select()
    .from(deptTable)
    .orderBy(asc(deptTable.sort_order), asc(deptTable.name));
  return rows as Department[];
}

export async function fetchMachines(): Promise<Machine[]> {
  const rows = await db
    .select()
    .from(machTable)
    .orderBy(asc(machTable.sort_order), asc(machTable.name));
  return rows as Machine[];
}
