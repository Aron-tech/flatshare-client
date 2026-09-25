type Listener = () => void;

const listeners = new Set<Listener>();

/** Jelzi, hogy a háztartás jutalmai megváltoztak (pl. új vagy szerkesztett jutalom). */
export function emitRewardsChanged() {
  listeners.forEach((listener) => listener());
}

export function subscribeRewardsChanged(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
