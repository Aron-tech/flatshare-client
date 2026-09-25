type Listener = () => void;

const listeners = new Set<Listener>();

/** Jelzi, hogy a háztartás feladat-definíciói megváltoztak (pl. új feladat). */
export function emitTasksChanged() {
  listeners.forEach((listener) => listener());
}

export function subscribeTasksChanged(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
