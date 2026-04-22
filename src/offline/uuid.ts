import { randomUUID } from 'expo-crypto';

// Single choke point for UUID generation so we can swap (or mock in tests)
// without hunting through call sites.
export const newId = (): string => randomUUID();
