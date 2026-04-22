// Tiny pub/sub so local mutations (saveJob / deletePhoto / etc) can tell list
// screens to refetch without plumbing a context through every call site.
// Lives outside React so non-hook functions can publish; hooks subscribe and
// convert fires into state changes.

type Listener = () => void;

const listeners = new Set<Listener>();

export function notifyLocalDataChanged(): void {
  for (const l of listeners) l();
}

export function subscribeLocalDataChanges(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
