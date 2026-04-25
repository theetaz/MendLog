// Tiny pub/sub so local mutations (saveJob / deletePhoto / etc) can tell list
// screens to refetch without plumbing a context through every call site.
// Lives outside React so non-hook functions can publish; hooks subscribe and
// convert fires into state changes.
//
// `source` lets subscribers distinguish UI-refresh-only signals from
// genuine user mutations. The auto-sync trigger in syncManager listens
// only to 'user' so it doesn't ping-pong with itself: every sync ends
// with a notify (so screens re-render after a pull merged new rows),
// and so does every realtime merge — neither should kick another sync.

export type DataChangeSource = 'user' | 'sync' | 'realtime';

type Listener = (source: DataChangeSource) => void;

const listeners = new Set<Listener>();

export function notifyLocalDataChanged(source: DataChangeSource = 'user'): void {
  for (const l of listeners) l(source);
}

export function subscribeLocalDataChanges(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
